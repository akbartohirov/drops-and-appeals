// src/controllers/appealController.js
import db from '../../db.js';
import { parse as csvParse } from 'csv-parse/sync';

/* -------------------------------- CSV IMPORT -------------------------------- */

export function importCsv(req, res) {
  if (!req.file) return res.status(400).json({ error: 'CSV fayl kerak (field name: file)' });

  const okMime = /text\/csv|application\/vnd\.ms-excel|application\/octet-stream/i.test(req.file.mimetype || '');
  if (!okMime) return res.status(400).json({ error: 'Faqat CSV qabul qilinadi' });

  let rows = null;
  const tryDelims = [',', ';', '\t'];

  // delimiter autodetect
  for (const delim of tryDelims) {
    try {
      rows = csvParse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: delim,
        relax_column_count: true,      // “Invalid Record Length”dan qutqaradi
      });
      // Agar 1 ta ustunli "mega-sarlavha" chiqsa, bu delimiter noto'g'ri bo'lishi mumkin
      const headerKeys = rows.length ? Object.keys(rows[0]) : [];
      if (headerKeys.length <= 1 && delim !== tryDelims[tryDelims.length - 1]) {
        continue; // keyingi delimiterga urinamiz
      }
      break;
    } catch (e) {
      rows = null;
    }
  }

  if (!Array.isArray(rows) || !rows.length) {
    return res.status(400).json({ error: 'CSV parse xatosi yoki bo‘sh fayl' });
  }
  if (rows.length > 10000) {
    return res.status(400).json({ error: 'Juda ko‘p qator (max 10000)' });
  }

  const tx = db.transaction((items) => {
    const stmt = db.prepare(`
      INSERT INTO appeals (
        applicant_name, address, phone,
        source_org, source_system,
        subject, direction,
        client_code, card,
        appeal_date, damage_amount,
        comment, created_by
      ) VALUES (
        @applicant_name, @address, @phone,
        @source_org, @source_system,
        @subject, @direction,
        @client_code, @card,
        @appeal_date, @damage_amount,
        @comment, @created_by
      )
    `);

    let inserted = 0, skipped = 0;
    for (let r of items) {
      const rec = safeMapAppealRecord(r); // norm/alias/date fix
      if (!rec.applicant_name || !rec.appeal_date) { skipped++; continue; }
      stmt.run({ ...rec, created_by: req.user.id });
      inserted++;
    }
    return { inserted, skipped };
  });

  const { inserted, skipped } = tx(rows);
  res.json({ ok: true, inserted, skipped });
}

/* ---------------- yordamchilar ---------------- */

function normKey(s) {
  return (s || '').toString().trim().toLowerCase().replace(/[.\s-]+/g, '_');
}
function buildKeyMap(obj) {
  const out = {};
  for (const k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) out[normKey(k)] = obj[k];
  return out;
}
function pick(map, keys) {
  for (const k of keys) {
    const nk = normKey(k);
    const v = map[nk];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}
function toISODate(s) {
  const v = (s || '').toString().trim();
  if (!v) return null;
  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  // dd.mm.yyyy yoki dd/mm/yyyy yoki dd-mm-yyyy
  const m = v.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) >= 70 ? '19' : '20') + y; // taxminiy
    return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Excel serial raqami bo'lsa: bu joyni xohlasang qo'shamiz
  return v.slice(0, 10);
}
function toNumOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/\s/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Alias mapping: name -> applicant_name va hokazo
const FIELD_ALIASES = {
  applicant_name: ['applicant_name', 'name', 'applicant', 'full_name', 'fio', 'murojaatchi', 'murojaatchi_nomi'],
  address: ['address', 'manzil'],
  phone: ['phone', 'tel', 'telefon', 'phone_number'],
  source_org: ['source_org', 'org', 'organization', 'tashkilot'],
  source_system: ['source_system', 'system', 'tizim'],
  subject: ['subject', 'predmet'],
  direction: ['direction', "yo'nalish", 'yonalish', 'yo’nalish'],
  client_code: ['client_code', 'clientid', 'customer_code', 'mijoz_kodi'],
  card: ['card', 'card_number', 'karta', 'pan'],
  appeal_date: ['appeal_date', 'date', 'sana'],
  damage_amount: ['damage_amount', 'zarar', 'amount', 'summa'],
  comment: ['comment', 'izoh', 'note', 'izohlar'],
};

function safeMapAppealRecord(raw) {
  const m = buildKeyMap(raw);
  const cardRaw = pick(m, FIELD_ALIASES.card);
  // kartani string sifatida saqlaymiz, E+ ga uchrasa ham
  const card = cardRaw == null ? null : String(cardRaw).replace(/\r?\n/g, ' ').trim();

  return {
    applicant_name: (pick(m, FIELD_ALIASES.applicant_name) || '').toString().trim(),
    address: pick(m, FIELD_ALIASES.address),
    phone: pick(m, FIELD_ALIASES.phone),
    source_org: pick(m, FIELD_ALIASES.source_org),
    source_system: pick(m, FIELD_ALIASES.source_system),
    subject: pick(m, FIELD_ALIASES.subject),
    direction: pick(m, FIELD_ALIASES.direction),
    client_code: pick(m, FIELD_ALIASES.client_code),
    card,
    appeal_date: toISODate(pick(m, FIELD_ALIASES.appeal_date)),
    damage_amount: toNumOrNull(pick(m, FIELD_ALIASES.damage_amount)),
    comment: pick(m, FIELD_ALIASES.comment),
  };
}

/* --------------------------------- CRUD API --------------------------------- */

export function list(req, res) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || '20', 10)));
  const q = (req.query.q || '').trim().toLowerCase();
  const offset = (page - 1) * limit;

  let where = '';
  const params = {};
  if (q) {
    where = `
      WHERE LOWER(a.applicant_name) LIKE @q
         OR LOWER(a.client_code)    LIKE @q
         OR LOWER(a.subject)        LIKE @q
         OR LOWER(a.source_org)     LIKE @q
         OR LOWER(a.source_system)  LIKE @q
         OR LOWER(a.direction)      LIKE @q
         OR LOWER(a.card)           LIKE @q
         OR LOWER(a.comment)        LIKE @q
    `;
    params.q = `%${q}%`;
  }

  const total = db.prepare(`SELECT COUNT(*) AS c FROM appeals a ${where}`).get(params).c;

  const rows = db.prepare(`
    SELECT a.*,
           u1.username AS creator_username,
           u2.username AS updated_by_username
    FROM appeals a
    LEFT JOIN users u1 ON u1.id = a.created_by
    LEFT JOIN users u2 ON u2.id = a.updated_by
    ${where}
    ORDER BY a.id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  res.json({ page, limit, total, rows });
}

export function getOne(req, res) {
  const row = db.prepare(`
    SELECT a.*,
           u1.username AS creator_username,
           u2.username AS updated_by_username
    FROM appeals a
    LEFT JOIN users u1 ON u1.id = a.created_by
    LEFT JOIN users u2 ON u2.id = a.updated_by
    WHERE a.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Appeal topilmadi' });
  res.json(row);
}

export function create(req, res) {
  const payload = {
    applicant_name: req.body.applicant_name,
    address: req.body.address || null,
    phone: req.body.phone || null,
    source_org: req.body.source_org || null,
    source_system: req.body.source_system || null,
    subject: req.body.subject || null,
    direction: req.body.direction || null,
    client_code: req.body.client_code || null,
    card: req.body.card || null,
    appeal_date: req.body.appeal_date,
    damage_amount: req.body.damage_amount ?? null,
    comment: req.body.comment || null,
    created_by: req.user.id
  };

  const info = db.prepare(`
    INSERT INTO appeals (
      applicant_name, address, phone, source_org, source_system,
      subject, direction, client_code, card, appeal_date,
      damage_amount, comment, created_by
    ) VALUES (
      @applicant_name, @address, @phone, @source_org, @source_system,
      @subject, @direction, @client_code, @card, @appeal_date,
      @damage_amount, @comment, @created_by
    )
  `).run(payload);

  const row = db.prepare(`
    SELECT a.*,
           u1.username AS creator_username,
           u2.username AS updated_by_username
    FROM appeals a
    LEFT JOIN users u1 ON u1.id = a.created_by
    LEFT JOIN users u2 ON u2.id = a.updated_by
    WHERE a.id = ?
  `).get(info.lastInsertRowid);

  res.status(201).json(row);
}

export function update(req, res) {
  const id = req.params.id;
  const prev = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
  if (!prev) return res.status(404).json({ error: 'Appeal topilmadi' });

  const p = req.body;

  db.prepare(`
    UPDATE appeals SET
      applicant_name = COALESCE(@applicant_name, applicant_name),
      address        = COALESCE(@address, address),
      phone          = COALESCE(@phone, phone),
      source_org     = COALESCE(@source_org, source_org),
      source_system  = COALESCE(@source_system, source_system),
      subject        = COALESCE(@subject, subject),
      direction      = COALESCE(@direction, direction),
      client_code    = COALESCE(@client_code, client_code),
      card           = COALESCE(@card, card),
      appeal_date    = COALESCE(@appeal_date, appeal_date),
      damage_amount  = COALESCE(@damage_amount, damage_amount),
      comment        = COALESCE(@comment, comment),
      updated_by     = @updated_by,
      updated_at     = datetime('now')
    WHERE id = @id
  `).run({
    id,
    applicant_name: p.applicant_name ?? undefined,
    address: p.address ?? undefined,
    phone: p.phone ?? undefined,
    source_org: p.source_org ?? undefined,
    source_system: p.source_system ?? undefined,
    subject: p.subject ?? undefined,
    direction: p.direction ?? undefined,
    client_code: p.client_code ?? undefined,
    card: p.card ?? undefined,
    appeal_date: p.appeal_date ?? undefined,
    damage_amount: p.damage_amount ?? undefined,
    comment: p.comment ?? undefined,
    updated_by: req.user.id
  });

  const row = db.prepare(`
    SELECT a.*,
           u1.username AS creator_username,
           u2.username AS updated_by_username
    FROM appeals a
    LEFT JOIN users u1 ON u1.id = a.created_by
    LEFT JOIN users u2 ON u2.id = a.updated_by
    WHERE a.id = ?
  `).get(id);

  res.json(row);
}

export function remove(req, res) {
  const info = db.prepare('DELETE FROM appeals WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Appeal topilmadi' });
  res.json({ ok: true });
}
