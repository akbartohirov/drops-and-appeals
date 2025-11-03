export function saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}
export function currentUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}
export function isAuthed() { return !!localStorage.getItem('token'); }
