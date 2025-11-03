import db from '../../db.js';
import bcrypt from 'bcrypt';

export function listUsers(req, res) {
    const rows = db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY id DESC').all();
    res.json(rows);
}

export function createUser(req, res) {
    const { username, password, is_admin = false } = req.body;
    const exists = db.prepare('SELECT 1 FROM users WHERE username=?').get(username);
    if (exists) return res.status(409).json({ error: 'username band' });
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)').run(username, hash, is_admin ? 1 : 0);
    const user = db.prepare('SELECT id, username, is_admin, created_at FROM users WHERE id=?').get(info.lastInsertRowid);
    res.status(201).json(user);
}

export function changePassword(req, res) {
    const { id } = req.params;
    const { password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
    if (!info.changes) return res.status(404).json({ error: 'User topilmadi' });
    res.json({ ok: true });
}

export function removeUser(req, res) {
    const { id } = req.params;
    // o‘zingni o‘zing o‘chirib qo‘ymaslik
    if (+id === req.user.id) return res.status(400).json({ error: 'O‘zingni o‘chira olmaysan' });
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    if (!info.changes) return res.status(404).json({ error: 'User topilmadi' });
    res.json({ ok: true });
}
