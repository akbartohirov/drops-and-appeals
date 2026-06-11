// Decoupled API Service for Banking Admin System
// Connects to Express API and SQLite backend using token authorization

const BASE_URL = '/api';

// Helper to assemble headers with the JWT authorization token
const getHeaders = () => {
  const token = localStorage.getItem('active_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ==========================================
// DTO MAPPERS (DATA SANITIZATION / DECOUPLING)
// Enforces that custom UI attributes from components are NOT saved
// and guarantees backend-safety by mapping fields explicitly.
// ==========================================

export const mapAppealFromApi = (apiData) => ({
  id: apiData.id ? String(apiData.id) : "",
  clientName: apiData.applicant_name || "",
  phone: apiData.phone || "",
  address: apiData.address || "",
  organization: apiData.source_org || "",
  system: apiData.source_system || "MOBILE",
  subject: apiData.subject || "",
  direction: apiData.direction || "",
  clientCode: apiData.client_code || "",
  cardNumber: apiData.card || "",
  date: apiData.appeal_date || "",
  lossAmount: Number(apiData.damage_amount) || 0,
  comment: apiData.comment || "",
  operatorId: apiData.created_by || "",
  creatorName: apiData.creator_name || "",
  updaterName: apiData.updater_name || "",
  createdAt: apiData.created_at || "",
  updatedAt: apiData.updated_at || ""
});

export const mapAppealToApi = (formData) => {
  return {
    applicant_name: String(formData.clientName || "").trim(),
    phone: String(formData.phone || "").replace(/\D/g, ""), // Keep only digits
    address: String(formData.address || "").trim(),
    source_org: String(formData.organization || "").trim(),
    source_system: String(formData.system || "MOBILE").toUpperCase(),
    subject: String(formData.subject || "").trim(),
    direction: String(formData.direction || "").trim(),
    client_code: String(formData.clientCode || "").trim() || `CLI-${Math.floor(10000 + Math.random() * 90000)}`,
    card: String(formData.cardNumber || "").replace(/\D/g, ""), // Keep only digits
    appeal_date: formData.date || new Date().toISOString().split("T")[0],
    damage_amount: Number(formData.lossAmount) || 0,
    comment: String(formData.comment || "").trim(),
    created_by: formData.operatorId || null
  };
};

export const mapDropCardFromApi = (apiData) => {
  const blockedAtStr = apiData.blocked_at || "";
  const parts = blockedAtStr.split(" ");
  const blockDate = parts[0] || "";
  const blockTime = parts[1] || "00:00:00";

  return {
    id: apiData.id ? String(apiData.id) : "",
    cardNumber: apiData.card_number || "",
    blockDate: blockDate,
    blockTime: blockTime,
    balance: Number(apiData.balance) || 0,
    comment: apiData.comment || "",
    operatorId: apiData.blocked_by || "",
    creatorName: apiData.creator_name || "",
    updaterName: apiData.updater_name || "",
    createdAt: apiData.created_at || "",
    updatedAt: apiData.updated_at || ""
  };
};

export const mapDropCardToApi = (formData) => {
  const now = new Date();
  const timeString = now.toTimeString().split(" ")[0]; // HH:MM:SS
  const blockDate = formData.blockDate || now.toISOString().split("T")[0];
  const blockTime = formData.blockTime || timeString;
  const blockedAt = `${blockDate} ${blockTime}`;

  return {
    card_number: String(formData.cardNumber || "").replace(/\D/g, ""), // Raw digits
    blocked_at: blockedAt,
    balance: Number(formData.balance) || 0,
    comment: String(formData.comment || "").trim(),
    blocked_by: formData.operatorId || null
  };
};

export const mapUserFromApi = (apiData) => ({
  id: apiData.id ? String(apiData.id) : "",
  username: apiData.username || "",
  email: apiData.email || `${apiData.username}@bank.uz`,
  role: apiData.role || (apiData.is_admin === 1 ? "Admin" : "User"),
  createdDate: apiData.createdDate || apiData.created_at || "",
  status: apiData.status || "Faol"
});

export const mapUserToApi = (formData) => {
  return {
    username: String(formData.username || "").toLowerCase().replace(/\s/g, ""),
    is_admin: formData.role === "Admin" ? 1 : 0,
    created_at: formData.createdDate || new Date().toLocaleDateString("uz-UZ", { day: 'numeric', month: 'long', year: 'numeric' })
  };
};

export const mapFraudFromApi = (apiData) => ({
  id: apiData.id ? String(apiData.id) : "",
  fraudType: apiData.fraud_type || "",
  description: apiData.description || "",
  victimName: apiData.victim_name || "",
  fraudDate: apiData.fraud_date || "",
  damageAmount: Number(apiData.damage_amount) || 0,
  measuresTaken: apiData.measures_taken || "",
  comments: apiData.comments || "",
  creatorName: apiData.creator_name || "",
  updaterName: apiData.updater_name || "",
  createdById: apiData.created_by ? String(apiData.created_by) : "",
  updatedById: apiData.updated_by ? String(apiData.updated_by) : "",
  createdAt: apiData.created_at || "",
  updatedAt: apiData.updated_at || "",
  attachments: (apiData.attachments || []).map(a => ({
    id: a.id ? String(a.id) : "",
    originalName: a.originalName || a.original_name || "",
    filePath: a.filePath || a.file_path || ""
  }))
});

// ==========================================
// ASYNCHRONOUS API SERVICES (REAL BACKEND)
// ==========================================

export const apiService = {
  // 1. Authentication
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Foydalanuvchi nomi yoki parol noto\'g\'ri!');
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('active_token', data.token);
    }
    return mapUserFromApi(data.user);
  },

  // 2. Appeals (Murojaatlar)
  getAppeals: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.search) params.append('search', options.search);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.direction) params.append('direction', options.direction);
    if (options.system) params.append('system', options.system);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/appeals${queryStr}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('active_user');
        localStorage.removeItem('active_token');
        window.location.href = '/login';
        throw new Error('Sessiya muddati tugadi, qaytadan kiring.');
      }
      const errData = await res.json();
      throw new Error(errData.message || 'Murojaatlarni yuklashda xatolik!');
    }

    const raw = await res.json();
    return {
      data: raw.data.map(mapAppealFromApi),
      pagination: raw.pagination,
      stats: raw.stats
    };
  },

  createAppeal: async (appealData) => {
    const cleanAppeal = mapAppealToApi(appealData);
    const res = await fetch(`${BASE_URL}/appeals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cleanAppeal)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Murojaatni saqlashda xatolik!');
    }

    const created = await res.json();
    return mapAppealFromApi(created);
  },

  // 3. Drop Cards
  getDropCards: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.search) params.append('search', options.search);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE_URL}/drop-cards${queryStr}`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Drop kartalarni yuklashda xatolik!');
    }

    const raw = await res.json();
    return {
      data: raw.data.map(mapDropCardFromApi),
      pagination: raw.pagination,
      stats: raw.stats
    };
  },

  createDropCard: async (cardData) => {
    const cleanCard = mapDropCardToApi(cardData);
    const res = await fetch(`${BASE_URL}/drop-cards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cleanCard)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Drop kartani saqlashda xatolik!');
    }

    const created = await res.json();
    return mapDropCardFromApi(created);
  },

  // 4. Admin User Management
  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Xodimlarni yuklashda xatolik!');
    }

    const raw = await res.json();
    return raw.map(mapUserFromApi);
  },

  createUser: async (userData) => {
    const cleanUser = mapUserToApi(userData);
    cleanUser.password = userData.password || 'operator123'; // Standard default password

    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cleanUser)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Xodim yaratishda xatolik!');
    }

    const created = await res.json();
    return mapUserFromApi(created);
  },

  deleteUser: async (userId) => {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Xodimni o\'chirishda xatolik!');
    }

    return await res.json();
  },

  toggleUserStatus: async (userId) => {
    const res = await fetch(`${BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Xodim statusini o\'zgartirishda xatolik!');
    }

    const updated = await res.json();
    return mapUserFromApi(updated);
  },

  // 5. Fraud Registry (Firibgarlik holatlari)
  getFrauds: async () => {
    const res = await fetch(`${BASE_URL}/fraud`, {
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Firibgarlik holatlarini yuklashda xatolik!');
    }

    const raw = await res.json();
    return raw.map(mapFraudFromApi);
  },

  createFraud: async (formData) => {
    const res = await fetch(`${BASE_URL}/fraud`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('active_token')}`
      },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Firibgarlik holatini saqlashda xatolik!');
    }

    const created = await res.json();
    return mapFraudFromApi(created);
  },

  deleteFraud: async (fraudId) => {
    const res = await fetch(`${BASE_URL}/fraud/${fraudId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Firibgarlik holatini o\'chirishda xatolik!');
    }

    return await res.json();
  },

  updateFraud: async (fraudId, formData) => {
    const res = await fetch(`${BASE_URL}/fraud/${fraudId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('active_token')}`
      },
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Firibgarlik holatini yangilashda xatolik!');
    }

    const updated = await res.json();
    return mapFraudFromApi(updated);
  }
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  let datePart = dateStr;
  let timePart = "";
  if (dateStr.includes(" ")) {
    const parts = dateStr.split(" ");
    datePart = parts[0];
    timePart = parts.slice(1).join(" ");
  } else if (dateStr.includes("T")) {
    const parts = dateStr.split("T");
    datePart = parts[0];
    timePart = parts[1];
    if (timePart.includes(".")) {
      timePart = timePart.split(".")[0];
    } else if (timePart.endsWith("Z")) {
      timePart = timePart.slice(0, -1);
    }
  }
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const formattedDate = `${day}.${month}.${year}`;
    return timePart ? `${formattedDate} ${timePart}` : formattedDate;
  }
  return dateStr;
};
