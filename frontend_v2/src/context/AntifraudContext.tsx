import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  PageType,
  UserSession,
  SystemUserItem,
  SystemUserRole,
  AppealItem,
  DropCardItem,
  FraudCaseItem,
  HumoClearingFile,
  DwhDropperProfile,
  AttachedFile,
} from '../types/antifraud';
import {
  INITIAL_APPEALS,
  INITIAL_DROP_CARDS,
  INITIAL_FRAUD_CASES,
  INITIAL_HUMO_CLEARING_FILES,
  INITIAL_DWH_DROPPERS,
  INITIAL_SYSTEM_USERS,
} from '../data/mockData';
import { apiService } from '../services/api';

interface AntifraudContextType {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  currentUser: UserSession | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoadingData: boolean;
  refreshAllData: () => Promise<void>;

  appeals: AppealItem[];
  updateAppealStatus: (id: string, status: AppealItem['status'], note?: string) => Promise<void>;
  addAppeal: (appeal: Partial<AppealItem> & { applicantName: string; cardNumber: string }) => Promise<void>;

  dropCards: DropCardItem[];
  updateDropCardStatus: (id: string, status: DropCardItem['status']) => void;
  addDropCard: (card: Partial<DropCardItem> & { cardNumber: string }) => Promise<void>;
  deleteDropCard: (id: string) => Promise<void>;

  fraudCases: FraudCaseItem[];
  addFraudCase: (
    fraudCase: Partial<FraudCaseItem> & { victimName: string; totalDamage: number },
    files?: File[]
  ) => Promise<void>;
  addFileToFraudCase: (
    caseId: string,
    file: Omit<AttachedFile, 'id' | 'uploadedAt' | 'uploadedBy'>,
    rawFile?: File
  ) => Promise<void>;
  removeFileFromFraudCase: (caseId: string, fileId: string) => Promise<void>;
  updateFraudCaseStatus: (caseId: string, status: FraudCaseItem['status']) => void;
  deleteFraudCase: (caseId: string) => Promise<void>;

  humoClearingFiles: HumoClearingFile[];
  processNewClearingFile: (fileName: string, type: HumoClearingFile['fileType']) => Promise<void>;
  isProcessingClearing: boolean;

  dwhDroppers: DwhDropperProfile[];
  isSyncingDwh: boolean;
  triggerDwhSync: () => Promise<void>;

  systemUsers: SystemUserItem[];
  addSystemUser: (user: { username: string; password: string; role: SystemUserRole }) => Promise<void>;
  toggleSystemUserStatus: (id: string) => Promise<void>;
  updateSystemUserRole: (id: string, role: SystemUserRole) => void;
  deleteSystemUser: (id: string) => Promise<void>;

  // Modal inspection states
  inspectingAppeal: AppealItem | null;
  setInspectingAppeal: (appeal: AppealItem | null) => void;
  inspectingFraudFiles: FraudCaseItem | null;
  setInspectingFraudFiles: (caseItem: FraudCaseItem | null) => void;
  inspectingDropCard: DropCardItem | null;
  setInspectingDropCard: (card: DropCardItem | null) => void;
}

const AntifraudContext = createContext<AntifraudContextType | undefined>(undefined);

const getStoredSession = (): UserSession | null => {
  try {
    const token = localStorage.getItem('active_token');
    const rawUser = localStorage.getItem('active_user');
    if (!token || !rawUser) return null;
    const parsed = JSON.parse(rawUser);
    return {
      id: String(parsed.id || '1'),
      username: parsed.username || 'admin',
      fullName: parsed.fullName || parsed.username || 'admin',
      role: parsed.role === 'Admin' ? 'Admin' : 'Operator',
      department: parsed.department || 'Antifrod va Axborot Xavfsizligi Boshqarmasi',
      bank: parsed.bank || 'Markaziy Kliring va Monitoring Markazi',
      badgeId: parsed.badgeId || `ID-${parsed.id || 1}`,
      loginTime: parsed.loginTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  } catch {
    return null;
  }
};

export const AntifraudProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialSession = getStoredSession();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(initialSession);
  const [currentPage, setCurrentPage] = useState<PageType>(initialSession ? 'dashboard' : 'login');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [appeals, setAppeals] = useState<AppealItem[]>(INITIAL_APPEALS);
  const [dropCards, setDropCards] = useState<DropCardItem[]>(INITIAL_DROP_CARDS);
  const [fraudCases, setFraudCases] = useState<FraudCaseItem[]>(INITIAL_FRAUD_CASES);
  const [systemUsers, setSystemUsers] = useState<SystemUserItem[]>(INITIAL_SYSTEM_USERS);

  // Unchanged local modules (Humo Clearing & DWH Droppers)
  const [humoClearingFiles, setHumoClearingFiles] = useState<HumoClearingFile[]>(INITIAL_HUMO_CLEARING_FILES);
  const [dwhDroppers, setDwhDroppers] = useState<DwhDropperProfile[]>(INITIAL_DWH_DROPPERS);

  const [isProcessingClearing, setIsProcessingClearing] = useState(false);
  const [isSyncingDwh, setIsSyncingDwh] = useState(false);

  const [inspectingAppeal, setInspectingAppeal] = useState<AppealItem | null>(null);
  const [inspectingFraudFiles, setInspectingFraudFiles] = useState<FraudCaseItem | null>(null);
  const [inspectingDropCard, setInspectingDropCard] = useState<DropCardItem | null>(null);

  const refreshAllData = useCallback(async () => {
    const token = localStorage.getItem('active_token');
    if (!token) return;

    setIsLoadingData(true);
    try {
      const [appealsRes, dropCardsRes, fraudsRes, usersRes] = await Promise.allSettled([
        apiService.getAppeals(),
        apiService.getDropCards(),
        apiService.getFrauds(),
        apiService.getUsers(),
      ]);

      if (appealsRes.status === 'fulfilled') {
        setAppeals(appealsRes.value);
      }
      if (dropCardsRes.status === 'fulfilled') {
        setDropCards(dropCardsRes.value);
      }
      if (fraudsRes.status === 'fulfilled') {
        setFraudCases(fraudsRes.value);
      }
      if (usersRes.status === 'fulfilled') {
        setSystemUsers(usersRes.value);
      }
    } catch (err) {
      console.error("Backend ma'lumotlarini yuklashda xato:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser, refreshAllData]);

  const login = async (usernameInput: string, passwordInput: string) => {
    const session = await apiService.login(usernameInput, passwordInput);
    setCurrentUser(session);
    setCurrentPage('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('active_token');
    localStorage.removeItem('active_user');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const updateAppealStatus = async (id: string, status: AppealItem['status'], note?: string) => {
    const target = appeals.find((a) => a.id === id);
    if (target) {
      try {
        const updated = await apiService.updateAppeal(id, target, note);
        setAppeals((prev) =>
          prev.map((app) =>
            app.id === id
              ? {
                  ...updated,
                  status,
                  resolutionNote: note || updated.resolutionNote,
                }
              : app
          )
        );
      } catch (err) {
        console.error('Murojaatni yangilashda xato:', err);
        setAppeals((prev) =>
          prev.map((app) =>
            app.id === id ? { ...app, status, resolutionNote: note || app.resolutionNote } : app
          )
        );
      }
    }
    if (inspectingAppeal && inspectingAppeal.id === id) {
      setInspectingAppeal((prev) =>
        prev ? { ...prev, status, resolutionNote: note || prev.resolutionNote } : null
      );
    }
  };

  const addAppeal = async (newAppeal: any) => {
    const created = await apiService.createAppeal(newAppeal);
    setAppeals((prev) => [created, ...prev]);
  };

  const updateDropCardStatus = (id: string, status: DropCardItem['status']) => {
    setDropCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, status } : card))
    );
    if (inspectingDropCard && inspectingDropCard.id === id) {
      setInspectingDropCard((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const addDropCard = async (newCard: Partial<DropCardItem> & { cardNumber: string }) => {
    const created = await apiService.createDropCard(newCard);
    setDropCards((prev) => [created, ...prev]);
  };

  const deleteDropCard = async (id: string) => {
    await apiService.deleteDropCard(id);
    setDropCards((prev) => prev.filter((c) => c.id !== id));
    if (inspectingDropCard && inspectingDropCard.id === id) {
      setInspectingDropCard(null);
    }
  };

  const addFraudCase = async (
    newCase: Partial<FraudCaseItem> & { victimName: string; totalDamage: number },
    files: File[] = []
  ) => {
    const created = await apiService.createFraud(newCase, files);
    setFraudCases((prev) => [created, ...prev]);
  };

  const addFileToFraudCase = async (
    caseId: string,
    file: Omit<AttachedFile, 'id' | 'uploadedAt' | 'uploadedBy'>,
    rawFile?: File
  ) => {
    const targetCase = fraudCases.find((c) => c.id === caseId);
    if (targetCase && rawFile) {
      const updated = await apiService.updateFraudFiles(targetCase, [rawFile], []);
      setFraudCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      if (inspectingFraudFiles && inspectingFraudFiles.id === caseId) {
        setInspectingFraudFiles(updated);
      }
      return;
    }

    const newFile: AttachedFile = {
      ...file,
      id: `f-${Date.now().toString().slice(-4)}`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      uploadedBy: currentUser ? currentUser.username : 'Operator',
    };

    setFraudCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, attachedFiles: [newFile, ...(c.attachedFiles || [])] } : c
      )
    );
    if (inspectingFraudFiles && inspectingFraudFiles.id === caseId) {
      setInspectingFraudFiles((prev) =>
        prev ? { ...prev, attachedFiles: [newFile, ...(prev.attachedFiles || [])] } : null
      );
    }
  };

  const removeFileFromFraudCase = async (caseId: string, fileId: string) => {
    const targetCase = fraudCases.find((c) => c.id === caseId);
    if (targetCase && !fileId.startsWith('f-')) {
      const updated = await apiService.updateFraudFiles(targetCase, [], [fileId]);
      setFraudCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      if (inspectingFraudFiles && inspectingFraudFiles.id === caseId) {
        setInspectingFraudFiles(updated);
      }
      return;
    }

    setFraudCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, attachedFiles: (c.attachedFiles || []).filter((f) => f.id !== fileId) }
          : c
      )
    );
    if (inspectingFraudFiles && inspectingFraudFiles.id === caseId) {
      setInspectingFraudFiles((prev) =>
        prev
          ? { ...prev, attachedFiles: (prev.attachedFiles || []).filter((f) => f.id !== fileId) }
          : null
      );
    }
  };

  const updateFraudCaseStatus = (caseId: string, status: FraudCaseItem['status']) => {
    setFraudCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status } : c))
    );
  };

  const deleteFraudCase = async (caseId: string) => {
    await apiService.deleteFraud(caseId);
    setFraudCases((prev) => prev.filter((c) => c.id !== caseId));
    if (inspectingFraudFiles && inspectingFraudFiles.id === caseId) {
      setInspectingFraudFiles(null);
    }
  };

  // Humo Clearing (local mock engine)
  const processNewClearingFile = async (
    fileName: string,
    fileType: HumoClearingFile['fileType']
  ) => {
    setIsProcessingClearing(true);
    await new Promise((r) => setTimeout(r, 1600));

    const totalTx = Math.floor(250000 + Math.random() * 150000);
    const totalVolume = Math.floor(60000000000 + Math.random() * 40000000000);
    const anomalies = Math.floor(180 + Math.random() * 250);
    const flaggedVolume = Math.floor(650000000 + Math.random() * 850000000);
    const detectedDrops = Math.floor(15 + Math.random() * 30);

    const newClearing: HumoClearingFile = {
      id: `humo-clr-${Date.now().toString().slice(-4)}`,
      fileName,
      fileType,
      fileDate: new Date().toISOString().split('T')[0],
      clearingCycle: 'Tezkor sessiya tahlili',
      fileSizeBytes: Math.floor(18000000 + Math.random() * 12000000),
      totalTransactions: totalTx,
      totalVolumeUzs: totalVolume,
      flaggedAnomaliesCount: anomalies,
      flaggedVolumeUzs: flaggedVolume,
      detectedDropCardsCount: detectedDrops,
      processingStatus: 'Tahlil yakunlandi',
      processedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      rulesTriggered: [
        {
          ruleCode: 'RULE-104',
          ruleName: "Tez-tez takrorlanuvchi P2P o'tkazmalar (Pilesos)",
          severity: 'Kritik',
          triggerCount: Math.floor(anomalies * 0.45),
          flaggedAmount: Math.floor(flaggedVolume * 0.5),
          detectedDropsCount: Math.floor(detectedDrops * 0.6),
          description: "Bir nechta yuboruvchidan bitta qabul qiluvchi drop hisobiga to'planishi.",
          status: 'Aktiv',
        },
        {
          ruleCode: 'RULE-312',
          ruleName: "Kesh-in orqali to'ldirish va darhol keshout (<90 sek)",
          severity: 'Kritik',
          triggerCount: Math.floor(anomalies * 0.3),
          flaggedAmount: Math.floor(flaggedVolume * 0.35),
          detectedDropsCount: Math.floor(detectedDrops * 0.3),
          description: "Mablag'ning hisobda minimal vaqt turishi va tezkor chiqib ketishi.",
          status: 'Aktiv',
        },
        {
          ruleCode: 'RULE-208',
          ruleName: 'Tungi vaqtda limitdan ortiq P2P oqimi (01:00 - 05:00)',
          severity: 'Yuqori',
          triggerCount: Math.floor(anomalies * 0.25),
          flaggedAmount: Math.floor(flaggedVolume * 0.15),
          detectedDropsCount: Math.max(1, Math.floor(detectedDrops * 0.1)),
          description: "Tungi nofaol soatlarda me'yordan ortiq tranzaksiya oqimi.",
          status: 'Aktiv',
        },
      ],
    };

    setHumoClearingFiles((prev) => [newClearing, ...prev]);
    setIsProcessingClearing(false);
  };

  // DWH Droppers (local mock engine)
  const triggerDwhSync = async () => {
    setIsSyncingDwh(true);
    await new Promise((r) => setTimeout(r, 1400));
    setDwhDroppers((prev) =>
      prev.map((d) => ({
        ...d,
        velocityPerMinute: Number((d.velocityPerMinute + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        uniqueIpAddresses: d.uniqueIpAddresses + (Math.random() > 0.5 ? 1 : 0),
        lastActiveDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      }))
    );
    setIsSyncingDwh(false);
  };

  const addSystemUser = async (newUser: {
    username: string;
    password: string;
    role: SystemUserRole;
  }) => {
    const created = await apiService.createUser(newUser);
    setSystemUsers((prev) => [...prev, created]);
  };

  const toggleSystemUserStatus = async (id: string) => {
    try {
      await apiService.toggleUserStatus(id);
    } catch (err) {
      console.error('Status yangilashda xato:', err);
    }
    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Faol' ? 'Nofaol' : 'Faol' } : u
      )
    );
  };

  const updateSystemUserRole = (id: string, role: SystemUserRole) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
  };

  const deleteSystemUser = async (id: string) => {
    await apiService.deleteUser(id);
    setSystemUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <AntifraudContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        currentUser,
        login,
        logout,
        isLoadingData,
        refreshAllData,
        appeals,
        updateAppealStatus,
        addAppeal,
        dropCards,
        updateDropCardStatus,
        addDropCard,
        deleteDropCard,
        fraudCases,
        addFraudCase,
        addFileToFraudCase,
        removeFileFromFraudCase,
        updateFraudCaseStatus,
        deleteFraudCase,
        humoClearingFiles,
        processNewClearingFile,
        isProcessingClearing,
        dwhDroppers,
        isSyncingDwh,
        triggerDwhSync,
        systemUsers,
        addSystemUser,
        toggleSystemUserStatus,
        updateSystemUserRole,
        deleteSystemUser,
        inspectingAppeal,
        setInspectingAppeal,
        inspectingFraudFiles,
        setInspectingFraudFiles,
        inspectingDropCard,
        setInspectingDropCard,
      }}
    >
      {children}
    </AntifraudContext.Provider>
  );
};

export const useAntifraud = () => {
  const context = useContext(AntifraudContext);
  if (!context) {
    throw new Error('useAntifraud must be used within an AntifraudProvider');
  }
  return context;
};
