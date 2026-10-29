import {
  AppealItem,
  DropCardItem,
  FraudCaseItem,
  SystemUserItem,
  SystemUserRole,
  UserSession,
  CardSystem,
} from '../types/antifraud';

const BASE_URL = '/api';

const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('active_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const formatDateTime = (raw: any): string => {
  if (!raw) return '';
  const str = String(raw);
  if (str.includes('T')) {
    return str.replace('T', ' ').split('.')[0].replace('Z', '');
  }
  return str;
};

const formatDateOnly = (raw: any): string => {
  if (!raw) return '';
  const str = String(raw);
  return str.slice(0, 10);
};

const formatCardSpaced = (raw: any): string => {
  const clean = String(raw || '').replace(/\D/g, '');
  if (clean.length === 16) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
  }
  return String(raw || '');
};

const maskCard = (raw: any): string => {
  const clean = String(raw || '').replace(/\D/g, '');
  if (clean.length >= 16) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 6)}** **** ${clean.slice(12, 16)}`;
  }
  return String(raw || '');
};

const formatPhoneDisplay = (raw: any): string => {
  const str = String(raw || '').trim();
  const digits = str.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  if (digits.length === 9) {
    return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
  }
  return str;
};

const detectCardSystem = (cardRaw: any, systemRaw?: any): CardSystem => {
  const sys = String(systemRaw || '').toUpperCase();
  if (sys.includes('UZCARD')) return 'Uzcard';
  if (sys.includes('HUMO')) return 'Humo';
  if (sys.includes('VISA')) return 'Visa';
  if (sys.includes('MASTER')) return 'Mastercard';
  const cleanCard = String(cardRaw || '').replace(/\D/g, '');
  if (cleanCard.startsWith('8600') || cleanCard.startsWith('5614')) return 'Uzcard';
  return 'Humo';
};

export const mapUserFromApi = (apiData: any): SystemUserItem => {
  const isAdmin =
    apiData.role === 'Admin' ||
    apiData.is_admin === 1 ||
    apiData.is_admin === true ||
    apiData.is_admin === '1';

  return {
    id: String(apiData.id ?? ''),
    username: apiData.username || '',
    role: (isAdmin ? 'Admin' : 'Operator') as SystemUserRole,
    status: (apiData.status === 'Nofaol' ? 'Nofaol' : 'Faol') as 'Faol' | 'Nofaol',
    createdDate: apiData.createdDate || formatDateOnly(apiData.created_at) || new Date().toISOString().slice(0, 10),
  };
};

export const mapAppealFromApi = (apiData: any): AppealItem => {
  const incidentDate = formatDateOnly(apiData.appeal_date || apiData.created_at);
  const createdAtTime = formatDateTime(apiData.created_at || apiData.appeal_date);
  const updatedAtTime = formatDateTime(apiData.updated_at || apiData.created_at || apiData.appeal_date);
  const damage = Number(apiData.damage_amount) || 0;
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const cardSpaced = formatCardSpaced(apiData.card);
  const cardSystem = detectCardSystem(apiData.card, apiData.source_system);

  return {
    id: String(apiData.id ?? ''),
    appealNumber: apiData.client_code || `APP-${apiData.id}`,
    applicantName: apiData.applicant_name || '',
    address: apiData.address || '',
    applicantPhone: formatPhoneDisplay(apiData.phone),
    organization: apiData.source_org || '',
    cardSystem,
    direction: apiData.direction || apiData.subject || '',
    clientCode: apiData.client_code || '',
    cardNumber: cardSpaced,
    incidentDate,
    creator: apiData.creator_name || (apiData.created_by ? `Operator #${apiData.created_by}` : 'Tizim'),
    createdAtTime,
    updatedAtTime,
    damageAmount: damage,
    amount: damage,
    createdAt: incidentDate,
    bankName: apiData.source_org || '',
    appealType: apiData.direction || apiData.subject || '',
    isCurrentMonth: incidentDate.slice(0, 7) === currentMonthStr,
    status: 'Yangi',
    priority: 'Muhim',
    assignedOfficer: apiData.creator_name || 'Operator',
    description: apiData.comment || apiData.subject || '',
    resolutionNote: apiData.comment || '',
  };
};

export const mapDropCardFromApi = (apiData: any): DropCardItem => {
  const blockedAtTime = formatDateTime(apiData.blocked_at || apiData.created_at);
  const blockedDate = formatDateOnly(apiData.blocked_at || apiData.created_at);
  const createdAtTime = formatDateTime(apiData.created_at || apiData.blocked_at);
  const updatedAtTime = formatDateTime(apiData.updated_at || apiData.created_at || apiData.blocked_at);
  const balance = Number(apiData.balance) || 0;
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const cardSpaced = formatCardSpaced(apiData.card_number);
  const masked = maskCard(apiData.card_number);
  const cardSystem = detectCardSystem(apiData.card_number);

  return {
    id: String(apiData.id ?? ''),
    cardNumber: cardSpaced,
    maskedCardNumber: masked,
    cardHolder: apiData.creator_name ? `Operator: ${apiData.creator_name}` : 'Drop hisob egasi',
    holderPinfl: '—',
    bankName: cardSystem === 'Humo' ? 'Humo Tizimi' : 'Uzcard Tizimi',
    cardSystem,
    blockedDate,
    balanceAmount: balance,
    totalTurnover: balance,
    transactionCount: 1,
    blockingReason: apiData.comment || 'Shubhali operatsiya',
    blockedBy: apiData.creator_name || (apiData.blocked_by ? `Operator #${apiData.blocked_by}` : 'Tizim'),
    createdAtTime: createdAtTime || blockedAtTime,
    updatedAtTime: updatedAtTime || blockedAtTime,
    dropPatternType: 'Tranzit tranzaksiya (Pilesos)',
    riskScore: 95,
    riskLevel: 'Kritik',
    status: 'Bloklangan',
    isCurrentMonth: blockedDate.slice(0, 7) === currentMonthStr,
    dwhAccount: `ID-${apiData.id}`,
    notes: apiData.comment || '',
  };
};

export const mapFraudFromApi = (apiData: any): FraudCaseItem => {
  const detectedDate = formatDateOnly(apiData.fraud_date || apiData.created_at);
  const damage = Number(apiData.damage_amount) || 0;
  const fraudType = apiData.fraud_type || 'Telegram fishing & Soxta botlar';
  const desc = apiData.description || '';

  return {
    id: String(apiData.id ?? ''),
    caseNumber: `FRD-${apiData.id}`,
    fraudTypeAndDescription: desc ? `${fraudType} — ${desc}` : fraudType,
    fraudCategory: fraudType as any,
    victimName: apiData.victim_name || '',
    victimPhone: apiData.comments || '',
    suspectDropCard: apiData.measures_taken || 'Aniqlanmoqda',
    suspectName: apiData.creator_name || 'Operator',
    bankName: apiData.measures_taken || 'Bank tizimi',
    totalDamage: damage,
    blockedAmount: damage,
    detectedDate,
    status: 'Ochiq',
    riskLevel: 'Kritik',
    investigatorNotes: desc,
    attachedFiles: (apiData.attachments || []).map((att: any) => ({
      id: String(att.id ?? ''),
      name: att.originalName || att.original_name || 'Fayl',
      size: 'Yuklangan',
      fileType: 'IIB arizasi' as const,
      uploadedAt: detectedDate,
      uploadedBy: apiData.creator_name || 'Operator',
      fileSizeKb: 512,
      filePath: att.filePath || att.file_path || '',
    })),
  };
};

export const apiService = {
  // 1. Auth
  login: async (username: string, password: string): Promise<UserSession> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Foydalanuvchi nomi yoki parol noto'g'ri!");
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('active_token', data.token);
    }

    const mappedUser = mapUserFromApi(data.user);
    const session: UserSession = {
      id: mappedUser.id,
      username: mappedUser.username,
      fullName: mappedUser.username,
      role: mappedUser.role,
      department: 'Antifrod va Axborot Xavfsizligi Boshqarmasi',
      bank: 'Markaziy Kliring va Monitoring Markazi',
      badgeId: `ID-${mappedUser.id}`,
      loginTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    localStorage.setItem('active_user', JSON.stringify(session));
    return session;
  },

  // 2. Dashboard Stats
  getDashboardStats: async (): Promise<{
    totalAppeals: number;
    totalLoss: number;
    totalBlockedCards: number;
  }> => {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Dashboard statistikasini olishda xatolik!');
    }
    return await res.json();
  },

  // 3. Appeals
  getAppeals: async (): Promise<AppealItem[]> => {
    const res = await fetch(`${BASE_URL}/appeals?limit=all`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Murojaatlarni yuklashda xatolik!');
    }
    const raw = await res.json();
    return (raw.data || []).map(mapAppealFromApi);
  },

  createAppeal: async (newAppeal: Partial<AppealItem>): Promise<AppealItem> => {
    const payload = {
      applicant_name: String(newAppeal.applicantName || '').trim(),
      phone: String(newAppeal.applicantPhone || '').replace(/\D/g, '') || '998000000000',
      address: String(newAppeal.address || '').trim(),
      source_org: String(newAppeal.organization || newAppeal.bankName || '').trim(),
      source_system: String(newAppeal.cardSystem || 'Humo').toUpperCase(),
      subject: String(newAppeal.direction || newAppeal.appealType || '').trim(),
      direction: String(newAppeal.direction || newAppeal.appealType || '').trim(),
      client_code:
        String(newAppeal.clientCode || '').trim() ||
        `CLI-${Math.floor(10000 + Math.random() * 90000)}`,
      card: String(newAppeal.cardNumber || '').replace(/\D/g, ''),
      appeal_date: newAppeal.incidentDate || new Date().toISOString().split('T')[0],
      damage_amount: Number(newAppeal.damageAmount || newAppeal.amount || 0),
      comment: String(newAppeal.description || '').trim(),
    };

    const res = await fetch(`${BASE_URL}/appeals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Murojaatni saqlashda xatolik!');
    }

    const created = await res.json();
    return mapAppealFromApi(created);
  },

  updateAppeal: async (id: string, appeal: AppealItem, note?: string): Promise<AppealItem> => {
    const payload = {
      applicant_name: appeal.applicantName,
      phone: String(appeal.applicantPhone || '').replace(/\D/g, '') || '998000000000',
      address: appeal.address || '',
      source_org: appeal.organization || appeal.bankName || '',
      source_system: String(appeal.cardSystem || 'Humo').toUpperCase(),
      subject: appeal.direction || '',
      direction: appeal.direction || '',
      client_code: appeal.clientCode || '',
      card: String(appeal.cardNumber || '').replace(/\D/g, ''),
      appeal_date: appeal.incidentDate || new Date().toISOString().split('T')[0],
      damage_amount: Number(appeal.damageAmount || appeal.amount || 0),
      comment: note !== undefined ? note : appeal.description || '',
    };

    const res = await fetch(`${BASE_URL}/appeals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Murojaatni yangilashda xatolik!');
    }

    const updated = await res.json();
    return mapAppealFromApi(updated);
  },

  // 4. Drop Cards
  getDropCards: async (): Promise<DropCardItem[]> => {
    const res = await fetch(`${BASE_URL}/drop-cards?limit=all`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Drop kartalarni yuklashda xatolik!');
    }
    const raw = await res.json();
    return (raw.data || []).map(mapDropCardFromApi);
  },

  createDropCard: async (newCard: Partial<DropCardItem>): Promise<DropCardItem> => {
    const nowTime = new Date().toTimeString().split(' ')[0];
    const blockDate = newCard.blockedDate || new Date().toISOString().split('T')[0];
    const payload = {
      card_number: String(newCard.cardNumber || '').replace(/\D/g, ''),
      blocked_at: `${blockDate} ${nowTime}`,
      balance: Number(newCard.balanceAmount || 0),
      comment: String(newCard.blockingReason || newCard.notes || '').trim(),
    };

    const res = await fetch(`${BASE_URL}/drop-cards`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Drop kartani saqlashda xatolik!');
    }

    const created = await res.json();
    return mapDropCardFromApi(created);
  },

  deleteDropCard: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/drop-cards/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Drop kartani o'chirishda xatolik!");
    }
  },

  // 5. Fraud Registry
  getFrauds: async (): Promise<FraudCaseItem[]> => {
    const res = await fetch(`${BASE_URL}/fraud`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Firibgarlik holatlarini yuklashda xatolik!');
    }
    const raw = await res.json();
    return (raw || []).map(mapFraudFromApi);
  },

  createFraud: async (
    newCase: Partial<FraudCaseItem> & { victimName: string; totalDamage: number },
    files: File[] = []
  ): Promise<FraudCaseItem> => {
    const formData = new FormData();
    formData.append('fraud_type', newCase.fraudCategory || 'Telegram fishing & Soxta botlar');
    formData.append('description', newCase.investigatorNotes || newCase.fraudTypeAndDescription || 'Firibgarlik holati');
    formData.append('victim_name', newCase.victimName);
    formData.append('fraud_date', newCase.detectedDate || new Date().toISOString().split('T')[0]);
    formData.append('damage_amount', String(Number(newCase.totalDamage) || 0));
    formData.append('measures_taken', newCase.suspectDropCard || '');
    formData.append('comments', newCase.victimPhone || '');

    files.forEach((f) => {
      formData.append('files', f);
    });

    const token = localStorage.getItem('active_token');
    const res = await fetch(`${BASE_URL}/fraud`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Firibgarlik holatini saqlashda xatolik!');
    }

    const created = await res.json();
    return mapFraudFromApi(created);
  },

  updateFraudFiles: async (
    fraudCase: FraudCaseItem,
    newFiles: File[] = [],
    deletedFileIds: string[] = []
  ): Promise<FraudCaseItem> => {
    const formData = new FormData();
    formData.append('fraud_type', fraudCase.fraudCategory || 'Telegram fishing & Soxta botlar');
    formData.append('description', fraudCase.investigatorNotes || fraudCase.fraudTypeAndDescription || 'Firibgarlik holati');
    formData.append('victim_name', fraudCase.victimName);
    formData.append('fraud_date', fraudCase.detectedDate || new Date().toISOString().split('T')[0]);
    formData.append('damage_amount', String(Number(fraudCase.totalDamage) || 0));
    formData.append('measures_taken', fraudCase.suspectDropCard || '');
    formData.append('comments', fraudCase.victimPhone || '');

    if (deletedFileIds.length > 0) {
      formData.append('deleted_file_ids', JSON.stringify(deletedFileIds));
    }

    newFiles.forEach((f) => {
      formData.append('files', f);
    });

    const token = localStorage.getItem('active_token');
    const res = await fetch(`${BASE_URL}/fraud/${fraudCase.id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Firibgarlik holatini yangilashda xatolik!');
    }

    const updated = await res.json();
    return mapFraudFromApi(updated);
  },

  deleteFraud: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/fraud/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Firibgarlik holatini o'chirishda xatolik!");
    }
  },

  // 6. Admin Users
  getUsers: async (): Promise<SystemUserItem[]> => {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Xodimlarni yuklashda xatolik!');
    }
    const raw = await res.json();
    return (raw || []).map(mapUserFromApi);
  },

  createUser: async (userData: {
    username: string;
    password: string;
    role: SystemUserRole;
  }): Promise<SystemUserItem> => {
    const payload = {
      username: userData.username.trim().toLowerCase(),
      password: userData.password,
      role: userData.role === 'Admin' ? 'Admin' : 'User',
    };

    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Xodim yaratishda xatolik!');
    }

    const created = await res.json();
    return mapUserFromApi(created);
  },

  deleteUser: async (userId: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Xodimni o'chirishda xatolik!");
    }
  },

  toggleUserStatus: async (userId: string): Promise<SystemUserItem> => {
    const res = await fetch(`${BASE_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Xodim statusini o'zgartirishda xatolik!");
    }
    const updated = await res.json();
    return mapUserFromApi(updated);
  },
};
