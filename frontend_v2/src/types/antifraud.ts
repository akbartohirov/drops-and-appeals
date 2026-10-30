/**
 * Sentinel Antifraud System Types
 * Bank va To'lov Tizimlari Xavfsizlik Platformasi
 */

export type PageType = 
  | 'login'
  | 'dashboard'
  | 'appeals'
  | 'drop-cards'
  | 'fraud-list'
  | 'humo-clearing'
  | 'droppers-find'
  | 'admin-panel'
  | 'sql-explorer';

export type SystemUserRole = 'Admin' | 'Operator';

export interface SystemUserItem {
  id: string;
  username: string;
  role: SystemUserRole;
  status: 'Faol' | 'Nofaol';
  createdDate: string;
}

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Operator' | 'Bosh tahlilchi' | 'Antifrod monitoring xodimi' | 'Xavfsizlik xizmati inspektori';
  department: string;
  bank: string;
  badgeId: string;
  loginTime: string;
}

export type RiskLevel = 'O\'rta' | 'Yuqori' | 'Kritik';

export type CardSystem = 'Humo' | 'Uzcard' | 'Visa' | 'Mastercard';

export interface AppealItem {
  id: string;
  appealNumber: string;
  applicantName: string; // 1. Murojaatchi (FISH)
  address: string; // 2. Manzil
  applicantPhone: string; // 3. Telefon
  organization: string; // 4. Tashkilot
  cardSystem: CardSystem; // 5. Tizim
  direction: string; // 6. Yo'nalish
  clientCode: string; // 7. Mijoz kodi
  cardNumber: string; // 8. Karta raqami
  incidentDate: string; // 9. Sana (YYYY-MM-DD)
  creator: string; // 10. Yaratuvchi
  createdAtTime: string; // 11. Yaratilgan vaqt (YYYY-MM-DD HH:mm:ss)
  updatedAtTime: string; // 12. O'zgartirilgan vaqt (YYYY-MM-DD HH:mm:ss)
  damageAmount: number; // 13. Zarar summasi (UZS)
  
  // Backward compatibility & operational properties
  amount: number; // synonym to damageAmount
  createdAt: string; // synonym to incidentDate
  bankName: string; // synonym to organization
  appealType?: string; // synonym to direction
  applicantPinfl?: string;
  isCurrentMonth: boolean;
  status: 'Yangi' | 'Tekshiruvda' | 'Ijobiy hal qilindi' | 'Rad etildi' | 'Kritik xavf';
  priority?: 'Oddiy' | 'Muhim' | 'Shoshilinch';
  assignedOfficer?: string;
  description?: string;
  resolutionNote?: string;
}

export interface DropCardItem {
  id: string;
  cardNumber: string; // 1. Karta raqami
  maskedCardNumber: string;
  cardHolder: string;
  holderPinfl: string;
  bankName: string;
  cardSystem: CardSystem;
  blockedDate: string; // 2. Bloklangan sana (YYYY-MM-DD)
  balanceAmount: number; // 3. Qoldiq summasi (UZS)
  totalTurnover: number; // UZS
  transactionCount: number;
  blockingReason: string; // 4. Izoh / Bloklash sababi
  blockedBy: string; // 5. Bloklagan shaxs
  createdAtTime: string; // 6. Yaratilgan vaqt (YYYY-MM-DD HH:mm:ss)
  updatedAtTime: string; // 7. O'zgartirilgan vaqt (YYYY-MM-DD HH:mm:ss)
  dropPatternType: 
    | 'Tranzit tranzaksiya (Pilesos)'
    | 'Kripto-P2P keshout'
    | 'Tezkor kesh-in / kesh-aut (<90 soniya)'
    | 'Ko\'p sonli unikal IP lardan kirish'
    | 'Tungi mikro-tranzaksiyalar to\'lqini';
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  status: 'Bloklangan' | 'Vaqtincha cheklangan' | 'Sud/IIBga yuborilgan' | 'Muzlatilgan';
  isCurrentMonth: boolean;
  dwhAccount: string;
  notes: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  fileType: 'IIB arizasi' | 'Sud qarori' | 'Bank xulosasi' | 'Skrinshot/Chek' | 'Tushuntirish xati' | 'DWH auditi';
  uploadedAt: string;
  uploadedBy: string;
  fileSizeKb: number;
  filePath?: string;
}

export interface FraudCaseItem {
  id: string;
  caseNumber: string;
  fraudTypeAndDescription?: string; // 1. Turi va Tasnifi
  fraudCategory: 
    | 'Telegram fishing & Soxta botlar'
    | 'Soxta investitsiya & Piramida'
    | 'Bank ilovasi sessiyasini o\'g\'irlash'
    | 'Drop tarmog\'i orqali yuvish'
    | 'Ijtimoiy muhandislik & SMS kod';
  victimName: string; // 2. Jabrlanuvchi F.I.O
  victimPhone: string;
  suspectDropCard: string;
  suspectName: string;
  bankName: string;
  totalDamage: number; // 3. Zarar Summasi (UZS)
  blockedAmount: number; // UZS
  detectedDate: string; // 4. Aniqlangan Sana (YYYY-MM-DD)
  status: 'Ochiq' | 'Tergovda' | 'Mablag\' to\'xtatilgan' | 'Mablag\' qaytarildi' | 'Yopilgan';
  riskLevel: RiskLevel;
  attachedFiles: AttachedFile[]; // 5. Ilovalar
  investigatorNotes: string;
}

export interface HumoRuleTrigger {
  ruleCode: string;
  ruleName: string;
  severity: 'O\'rta' | 'Yuqori' | 'Kritik';
  triggerCount: number;
  flaggedAmount: number; // UZS
  detectedDropsCount: number;
  description: string;
  status: 'Aktiv' | 'Monitoring';
}

export interface HumoClearingFile {
  id: string;
  fileName: string;
  fileType: 'CLM' | 'STL' | 'DAT' | 'XML';
  fileDate: string; // YYYY-MM-DD
  clearingCycle: string;
  fileSizeBytes: number;
  totalTransactions: number;
  totalVolumeUzs: number;
  flaggedAnomaliesCount: number;
  flaggedVolumeUzs: number;
  detectedDropCardsCount: number;
  processingStatus: 'Tahlil yakunlandi' | 'Qayta ishlanmoqda' | 'Xatolik' | 'Navbatda';
  processedAt: string;
  rulesTriggered: HumoRuleTrigger[];
}

export interface DwhTransactionNode {
  id: string;
  type: 'victim' | 'dropper' | 'transit' | 'cashout';
  label: string;
  name: string;
  account: string;
  bank: string;
  amount: number;
  time: string;
  riskScore: number;
}

export interface DwhDropperProfile {
  id: string;
  pinfl: string;
  fullName: string;
  accountNumber: string; // 20208...
  bankName: string;
  associatedCardsCount: number;
  holdingTimeSeconds: number; // O'rtacha hisobda turish vaqti
  inOutRatio: number; // Kirish/Chiqish balansi nisbati (e.g. 0.98 = 98%)
  velocityPerMinute: number; // Daqiqasiga operatsiyalar
  totalInflowUzs: number;
  totalOutflowUzs: number;
  uniqueIpAddresses: number;
  firstActiveDate: string;
  lastActiveDate: string;
  riskStatus: 'Gumonlanuvchi' | 'Tasdiqlangan Dropper' | 'Tergov ostida' | 'Bloklangan';
  networkChainDepth: number; // Zanjir chuqurligi
}
