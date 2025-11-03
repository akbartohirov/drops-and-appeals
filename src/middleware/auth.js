import jwt from 'jsonwebtoken';

export function signToken(user) {
    const payload = { id: user.id, username: user.username, is_admin: !!user.is_admin };
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '1h' });
}

export function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token kerak' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
        next();
    } catch {
        res.status(401).json({ error: 'Token noto‘g‘ri yoki muddati o‘tgan' });
    }
}

export function requireAdmin(req, res, next) {
    if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin huquqi kerak' });
    next();
}