import db from '../../db.js';
import { parse as csvParse } from 'csv-parse/sync';


const FIELD_ALIASES = {
    card_number: ['card_number', 'card', 'karta', 'pan', 'card no', 'cardno'],
    balance: ['balance', 'qoldiq', 'amount', 'summa'],
    blocked_at: ['blocked_at', 'date', 'sana', 'blocked_date'],
    comment: ['comment', 'izoh', 'note', 'izohlar'],
};

function normKey(s) {
    return (s || '').toString().trim().toLowerCase().replace(/[.\s\-]+/g, '_');
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
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    const m = v.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
    if (m) {
        let [, d, mo, y] = m;
        if (y.length === 2) y = (Number(y) >= 70 ? '19' : '20') + y;
        return `${y.padStart(4, '0')}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return v.slice(0, 10);
}
function toNumOrNull(v) {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(String(v).replace(/\s/g, ''));
    return Number.isFinite(n) ? n : null;
}

// CSV/JSONdagi kalit nomlari har xil bo‘lsa ham to‘g‘ri map qiladi
function mapDropRecord(raw) {
    const m = buildKeyMap(raw);
    const panRaw = pick(m, FIELD_ALIASES.card_number);
    const card_number = panRaw == null ? '' : String(panRaw).replace(/\r?\n/g, ' ').trim(); // hech qachon numberga aylantirmaymiz
    return {
        card_number,
        balance: toNumOrNull(pick(m, FIELD_ALIASES.balance)),
        blocked_at: toISODate(pick(m, FIELD_ALIASES.blocked_at)),
        comment: pick(m, FIELD_ALIASES.comment),
    };
}

export function importCsv(req, res) {
    if (!req.file) return res.status(400).json({ error: 'CSV fayl kerak (field: file)' });

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
                relax_column_count: true,
            });
            const headerKeys = rows.length ? Object.keys(rows[0]) : [];
            if (headerKeys.length <= 1 && delim !== tryDelims[tryDelims.length - 1]) {
                continue;
            }
            break;
        } catch {
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
      INSERT INTO drop_cards (
        card_number, blocked_at, balance, blocked_by, comment
      ) VALUES (
        @card_number, @blocked_at, @balance, @blocked_by, @comment
      )
    `);

        let inserted = 0, skipped = 0;
        for (const raw of items) {
            const rec = mapDropRecord(raw);
            // minimal talab: card_number + blocked_at
            if (!rec.card_number || !rec.blocked_at) { skipped++; continue; }
            stmt.run({
                ...rec,
                blocked_by: req.user.id, // kim yuklagan bo'lsa shu foydalanuvchi
            });
            inserted++;
        }
        return { inserted, skipped };
    });

    const { inserted, skipped } = tx(rows);
    res.json({ ok: true, inserted, skipped });
}

/* --------------------------------- CRUD API --------------------------------- */

export function list(req, res) {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || '20', 10)));
    const q = (req.query.q || '').trim().toLowerCase();
    const offset = (page - 1) * limit;

    let where = '';
    let params = {};
    if (q) {
        where = `WHERE lower(card_number) LIKE @q OR lower(comment) LIKE @q`;
        params.q = `%${q}%`;
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM drop_cards ${where}`).get(params).c;
    const rows = db.prepare(`
    SELECT d.*, u1.username AS blocked_by_username, u2.username AS updated_by_username
    FROM drop_cards d
    JOIN users u1 ON d.blocked_by = u1.id
    LEFT JOIN users u2 ON d.updated_by = u2.id
    ${where}
    ORDER BY d.id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

    res.json({ page, limit, total, rows });
}

export function getOne(req, res) {
    const row = db.prepare(`
    SELECT d.*, u1.username AS blocked_by_username, u2.username AS updated_by_username
    FROM drop_cards d
    JOIN users u1 ON d.blocked_by = u1.id
    LEFT JOIN users u2 ON d.updated_by = u2.id
    WHERE d.id = ?
  `).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Drop card topilmadi' });
    res.json(row);
}

export function create(req, res) {
    const payload = {
        card_number: req.body.card_number,
        blocked_at: req.body.blocked_at,
        balance: req.body.balance ?? null,
        blocked_by: req.user.id,
        comment: req.body.comment || null
    };
    const info = db.prepare(`
    INSERT INTO drop_cards (card_number, blocked_at, balance, blocked_by, comment)
    VALUES (@card_number, @blocked_at, @balance, @blocked_by, @comment)
  `).run(payload);
    const row = db.prepare('SELECT * FROM drop_cards WHERE id=?').get(info.lastInsertRowid);
    res.status(201).json(row);
}

export function update(req, res) {
    const id = req.params.id;
    const prev = db.prepare('SELECT * FROM drop_cards WHERE id=?').get(id);
    if (!prev) return res.status(404).json({ error: 'Drop card topilmadi' });

    const payload = {
        id,
        card_number: req.body.card_number ?? prev.card_number,
        blocked_at: req.body.blocked_at ?? prev.blocked_at,
        balance: req.body.balance ?? prev.balance,
        comment: req.body.comment ?? prev.comment,
        updated_by: req.user.id
    };

    db.prepare(`
    UPDATE drop_cards SET
      card_number=@card_number, blocked_at=@blocked_at, balance=@balance, comment=@comment,
      updated_by=@updated_by, updated_at = datetime('now')
    WHERE id=@id
  `).run(payload);

    const row = db.prepare('SELECT * FROM drop_cards WHERE id=?').get(id);
    res.json(row);
}

export function remove(req, res) {
    const info = db.prepare('DELETE FROM drop_cards WHERE id=?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Drop card topilmadi' });
    res.json({ ok: true });
}
