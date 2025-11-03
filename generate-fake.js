// generate-fake.js
// Run misollar:
//   node generate-fake.js --users 5 --appeals 50 --drops 30
//   npm run fake -- --users 3 --appeals 20 --drops 10

import db from './db.js';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

// -------- CLI arg o‘qish
function argNum(name, dflt = 0) {
    const i = process.argv.indexOf(`--${name}`);
    if (i === -1) return dflt;
    const v = Number.parseInt(process.argv[i + 1], 10);
    return Number.isFinite(v) ? v : dflt;
}
const N_USERS = argNum('users', 0);
const N_APPEALS = argNum('appeals', 0);
const N_DROPS = argNum('drops', 0);

// Ixtiyoriy: deterministik random uchun seed
// faker.seed(42);

// -------- Kichik yordamchilar
function ensureTables() {
    // oddiy check: jadval bormi-yo‘qmi (PRAGMA_ok emas, yengil yo‘l)
    const must = ['users', 'appeals', 'drop_cards'];
    for (const t of must) {
        try { db.prepare(`SELECT 1 FROM ${t} LIMIT 1`).get(); }
        catch (e) {
            throw new Error(`DB jadvali yo‘q: ${t}. Avval serverni (server.js) ishga tushirib, jadval yaratilganiga ishonch hosil qil.`);
        }
    }
    // foreign key yoqib qo‘yamiz, shunchaki ishonch uchun
    db.pragma('foreign_keys = ON');
}

function getAllUsers() {
    return db.prepare('SELECT id, username, is_admin FROM users ORDER BY id').all();
}

// -------- Users
function createUsers(n) {
    if (n <= 0) return [];
    const insert = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)');
    const tx = db.transaction((count) => {
        const created = [];
        for (let i = 0; i < count; i++) {
            const base = faker.internet.username().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 12);
            const username = `${base}${faker.number.int({ min: 1, max: 9999 })}`;
            const plain = `Pass${faker.number.int({ min: 1000, max: 9999 })}`;
            const hash = bcrypt.hashSync(plain, 10);
            const info = insert.run(username, hash);
            created.push({ id: info.lastInsertRowid, username, password: plain });
        }
        return created;
    });
    return tx(n);
}

// -------- Appeals
function createAppeals(n) {
    if (n <= 0) return [];
    const users = getAllUsers();
    if (!users.length) throw new Error('Users yo‘q — avval admin yoki users yarating.');

    const insert = db.prepare(`
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

    const tx = db.transaction((count) => {
        const created = [];
        for (let i = 0; i < count; i++) {
            const u = faker.helpers.arrayElement(users);
            const payload = {
                applicant_name: faker.person.fullName(),
                address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
                phone: faker.phone.number('+998-##-###-##-##'),
                source_org: faker.company.name(),
                source_system: faker.helpers.arrayElement(['ATM', 'Internet Banking', 'POS', 'Mobile App']),
                subject: faker.lorem.words({ min: 2, max: 5 }),
                direction: faker.helpers.arrayElement(['Inquiry', 'Complaint', 'Information', 'Request']),
                client_code: faker.string.uuid().slice(0, 12),
                card: faker.finance.creditCardNumber(), // to‘liq PAN (formatli satr)
                appeal_date: faker.date.past({ years: 2 }).toISOString().slice(0, 10),
                damage_amount: faker.number.float({ min: 0, max: 10000, precision: 0.01 }),
                comment: faker.lorem.sentence(),
                created_by: u.id
            };
            const info = insert.run(payload);
            created.push({ id: info.lastInsertRowid, ...payload });
        }
        return created;
    });

    return tx(n);
}

// Tasodifiy yangilash: updated_by/updated_at to‘ldiramiz
function randomlyUpdateSomeAppeals(ids, ratio = 0.4) {
    if (!ids.length) return 0;
    const users = getAllUsers();
    if (!users.length) return 0;
    const upd = db.prepare(`
    UPDATE appeals SET
      subject     = CASE WHEN subject IS NULL OR subject = '' THEN 'upd' ELSE subject || ' (upd)' END,
      updated_by  = @updated_by,
      updated_at  = datetime('now')
    WHERE id = @id
  `);
    const tx = db.transaction((arr) => {
        let c = 0;
        for (const id of arr) {
            if (Math.random() < ratio) {
                const u = faker.helpers.arrayElement(users);
                upd.run({ id, updated_by: u.id });
                c++;
            }
        }
        return c;
    });
    return tx(ids);
}

// -------- Drops
function createDropCards(n) {
    if (n <= 0) return [];
    const users = getAllUsers();
    if (!users.length) throw new Error('Users yo‘q — avval admin yoki users yarating.');

    const insert = db.prepare(`
    INSERT INTO drop_cards (
      card_number, blocked_at, balance, blocked_by, comment
    ) VALUES (
      @card_number, @blocked_at, @balance, @blocked_by, @comment
    )
  `);

    const tx = db.transaction((count) => {
        const created = [];
        for (let i = 0; i < count; i++) {
            const u = faker.helpers.arrayElement(users);
            // to‘liq karta, bo‘sh joy va tirelarni ham olib tashlab yuborsang ham bo‘ladi
            const fullPan = faker.finance.creditCardNumber().replace(/[ -]/g, '');
            const payload = {
                card_number: fullPan,
                blocked_at: faker.date.recent({ days: 1000 }).toISOString().slice(0, 10),
                balance: faker.number.float({ min: 0, max: 20000, precision: 0.01 }),
                blocked_by: u.id,
                comment: faker.lorem.sentence()
            };
            const info = insert.run(payload);
            created.push({ id: info.lastInsertRowid, ...payload });
        }
        return created;
    });

    return tx(n);
}

// -------- Main
function main() {
    try {
        console.log(`fake-gen: users=${N_USERS}, appeals=${N_APPEALS}, drops=${N_DROPS}`);

        ensureTables();

        if (N_USERS > 0) {
            console.log('• Users yaratilmoqda...');
            const created = createUsers(N_USERS);
            for (const u of created) {
                console.log(`  - ${u.username}  (parol: ${u.password})`);
            }
            console.log(`  ✓ ${created.length} user qo‘shildi`);
        } else {
            console.log('• Users: o‘tkazib yuborildi');
        }

        let appeals = [];
        if (N_APPEALS > 0) {
            console.log('• Appeals yaratilmoqda...');
            appeals = createAppeals(N_APPEALS);
            console.log(`  ✓ ${appeals.length} appeal qo‘shildi`);
            const updCnt = randomlyUpdateSomeAppeals(appeals.map(a => a.id), 0.4);
            console.log(`  ✓ ${updCnt} ta appeal tasodifiy yangilandi (updated_by/updated_at)`);
        } else {
            console.log('• Appeals: o‘tkazib yuborildi');
        }

        if (N_DROPS > 0) {
            console.log('• Drop kartalar yaratilmoqda...');
            const drops = createDropCards(N_DROPS);
            console.log(`  ✓ ${drops.length} drop karta qo‘shildi`);
        } else {
            console.log('• Drops: o‘tkazib yuborildi');
        }

        console.log('Tayyor. Fake data generatsiya tugadi.');
    } catch (e) {
        console.error('Xatolik:', e?.message || e);
        process.exit(1);
    }
}

main();
