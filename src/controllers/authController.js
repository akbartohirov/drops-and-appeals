import db from '../../db.js';
import bcrypt from 'bcrypt';
import { signToken } from '../middleware/auth.js';

export function login(req, res) {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
    if (!bcrypt.compareSync(password, user.password_hash))
        return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
    const token = signToken(user);
    res.json({ token, user: { id: user.id, username: user.username, is_admin: !!user.is_admin } });
}
