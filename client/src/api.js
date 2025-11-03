// src/api.js
// Fetch o'rami: JSON/FormData, token, xatolar, 304/204, no-store cache.

const BASE_URL = '/api';

function getToken() {
    try {
        const auth = JSON.parse(localStorage.getItem('auth'));
        if (auth?.token) return auth.token;
    } catch { }
    return localStorage.getItem('token') || '';
}

function buildUrl(path, params) {
    if (!params) return `${BASE_URL}${path}`;
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        usp.set(k, String(v));
    }
    const qs = usp.toString();
    return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

async function request(
    path,
    { method = 'GET', body, auth = true, params, signal } = {}
) {
    const headers = { Accept: 'application/json' };
    let payload;

    if (body instanceof FormData) {
        payload = body; // boundary'ni browser o'zi qo'yadi
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    if (auth) {
        const t = getToken();
        if (t) headers.Authorization = `Bearer ${t}`;
    }

    const res = await fetch(buildUrl(path, params), {
        method,
        headers,
        body: payload,
        signal,
        cache: 'no-store' // 304 keltiradigan cache'larni bosamiz
    });

    // 204 yoki 304: body yo'q, normal holat
    if (res.status === 204 || res.status === 304) return null;

    let data = null;
    try {
        data = await res.json();
    } catch {
        // Ba'zan backend text qaytarishi mumkin; json bo'lmasa ham yiqilmaymiz
    }

    if (!res.ok) {
        const msg = data?.error || data?.message || res.statusText || 'So‘rov xatosi';
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }

    return data;
}

export const api = {
    // AUTH
    login: (username, password) =>
        request('/auth/login', { method: 'POST', body: { username, password }, auth: false }),

    // APPEALS
    listAppeals: (q = '', page = 1, limit = 200) =>
        request('/appeals', { params: { q, page, limit } }),
    getAppeal: (id) => request(`/appeals/${id}`),
    createAppeal: (payload) => request('/appeals', { method: 'POST', body: payload }),
    updateAppeal: (id, patch) => request(`/appeals/${id}`, { method: 'PATCH', body: patch }),
    deleteAppeal: (id) => request(`/appeals/${id}`, { method: 'DELETE' }),
    importAppealsCsv: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return request('/appeals/import-csv', { method: 'POST', body: fd });
    },

    // DROPS
    listDrops: (q = '', page = 1, limit = 200) =>
        request('/drops', { params: { q, page, limit } }),
    getDrop: (id) => request(`/drops/${id}`),
    createDrop: (payload) => request('/drops', { method: 'POST', body: payload }),
    updateDrop: (id, patch) => request(`/drops/${id}`, { method: 'PATCH', body: patch }),
    deleteDrop: (id) => request(`/drops/${id}`, { method: 'DELETE' }),
    importDropsCsv: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return request('/drops/import-csv', { method: 'POST', body: fd });
    },

    // USERS (admin)
    listUsers: () => request('/users'),
    createUser: ({ username, password, is_admin = false }) =>
        request('/users', { method: 'POST', body: { username, password, is_admin } }),
    updateUser: (id, patch) => request(`/users/${id}`, { method: 'PATCH', body: patch }),
    changePassword: (id, password) =>
        request(`/users/${id}/password`, { method: 'PATCH', body: { password } }),
    deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export default api;
