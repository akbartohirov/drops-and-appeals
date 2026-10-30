import React, { useState, useMemo } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { ModalDialog } from '../components/common/ModalDialog';
import { FraudCaseItem, AttachedFile } from '../types/antifraud';
import { formatUzs, calculateFraudStats } from '../utils/rules';
import { 
  FileWarning,
  TrendingDown, 
  Calendar, 
  Paperclip, 
  Upload, 
  ShieldAlert, 
  Lock, 
  Plus, 
  Eye, 
  X, 
  Check, 
  RotateCcw,
  FileText,
  User,
  ArrowRight
} from 'lucide-react';

export const FraudListPage: React.FC = () => {
  const { 
    fraudCases, 
    setInspectingFraudFiles, 
    addFraudCase, 
    currentUser,
    updateFraudCaseStatus 
  } = useAntifraud();

  // Davr oralig'i (period) filtri
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Yangi qator (holat) qo'shish modal holati
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newCase, setNewCase] = useState({
    fraudCategory: 'Telegram fishing & Soxta botlar' as FraudCaseItem['fraudCategory'],
    description: '',
    victimName: '',
    victimPhone: '+998 ',
    totalDamage: '',
    blockedAmount: '',
    detectedDate: new Date().toISOString().split('T')[0],
    suspectDropCard: '',
    suspectName: '',
    bankName: 'Kapitalbank ATB',
    status: 'Ochiq' as FraudCaseItem['status'],
    initialFileName: '',
  });

  // Filtered cases faqat Davr oralig'i bo'yicha
  const filteredCases = useMemo(() => {
    return fraudCases.filter((item) => {
      const date = item.detectedDate || '';
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [fraudCases, startDate, endDate]);

    // Aggregate stats:
  // 1. Jami holatlar
  // 2. Jami zarar
  // 3. Joriy oydagi holatlar
  // 4. Joriy oydagi zarar
  const fraudStats = useMemo(() => {
    return calculateFraudStats(fraudCases);
  }, [fraudCases]);

  // Handle adding new fraud case
  const handleCreateFraudCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.victimName || !newCase.totalDamage) return;

    try {
      await addFraudCase(
        {
          fraudCategory: newCase.fraudCategory,
          fraudTypeAndDescription: `${newCase.fraudCategory} — ${newCase.description || "Yangi da'vo arizasi"}`,
          victimName: newCase.victimName,
          victimPhone: newCase.victimPhone,
          totalDamage: parseFloat(newCase.totalDamage) || 0,
          blockedAmount: parseFloat(newCase.blockedAmount) || 0,
          detectedDate: newCase.detectedDate,
          suspectDropCard: newCase.suspectDropCard || '9860 **** **** ****',
          suspectName: newCase.suspectName || 'Aniqlanmoqda',
          bankName: newCase.bankName,
          status: newCase.status,
          investigatorNotes: newCase.description,
        },
        selectedFiles
      );

      setIsNewModalOpen(false);
      setSelectedFiles([]);
      setNewCase({
        fraudCategory: 'Telegram fishing & Soxta botlar',
        description: '',
        victimName: '',
        victimPhone: '+998 ',
        totalDamage: '',
        blockedAmount: '',
        detectedDate: new Date().toISOString().split('T')[0],
        suspectDropCard: '',
        suspectName: '',
        bankName: 'Kapitalbank ATB',
        status: 'Ochiq',
        initialFileName: '',
      });
    } catch (err: any) {
      alert(err?.message || 'Firibgarlik holatini saqlashda xatolik!');
    }
  };

  // 6 Exact Columns Requested:
  // 1. Turi va Tasnifi
  // 2. Jabrlanuvchi F.I.O
  // 3. Zarar Summasi
  // 4. Aniqlangan Sana
  // 5. Ilovalar
  // 6. Amallar
  const columns: ColumnDef<FraudCaseItem>[] = [
    // 1. Turi va Tasnifi
    {
      key: 'fraudCategory',
      header: 'Turi va Tasnifi',
      render: (row) => (
        <div className="max-w-[280px]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-[10px] text-red-400 font-bold px-1.5 py-0.2 rounded bg-red-950/60 border border-red-900/60">
              {row.caseNumber}
            </span>
            <span className="text-xs font-semibold text-slate-100 truncate block">
              {row.fraudCategory}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2" title={row.fraudTypeAndDescription || row.investigatorNotes}>
            {row.fraudTypeAndDescription || row.investigatorNotes || row.fraudCategory}
          </p>
        </div>
      ),
    },
    // 2. Jabrlanuvchi F.I.O
    {
      key: 'victimName',
      header: 'Jabrlanuvchi F.I.O',
      render: (row) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-slate-100 text-xs truncate" title={row.victimName}>
            {row.victimName}
          </p>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            {row.victimPhone}
          </p>
          {row.bankName && (
            <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
              {row.bankName}
            </span>
          )}
        </div>
      ),
    },
    // 3. Zarar Summasi
    {
      key: 'totalDamage',
      header: 'Zarar Summasi',
      align: 'right',
      render: (row) => (
        <div className="text-right whitespace-nowrap min-w-[130px]">
          <span className="font-mono text-xs font-bold text-red-400 block tabular-nums">
            {formatUzs(row.totalDamage)}
          </span>
          {row.blockedAmount > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5" title="Drop hisobida to'xtatilgan mablag'">
              Muzlatilgan: {formatUzs(row.blockedAmount)}
            </span>
          )}
        </div>
      ),
    },
    // 4. Aniqlangan Sana
    {
      key: 'detectedDate',
      header: 'Aniqlangan Sana',
      render: (row) => (
        <div className="whitespace-nowrap">
          <span className="font-mono text-xs text-slate-300 block">
            {row.detectedDate}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md border inline-block mt-0.5 ${
            row.status === 'Mablag\' to\'xtatilgan'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              : row.status === 'Tergovda'
              ? 'bg-blue-950/60 text-blue-300 border-blue-800'
              : row.status === 'Mablag\' qaytarildi'
              ? 'bg-teal-950/60 text-teal-300 border-teal-800'
              : 'bg-amber-950/60 text-amber-300 border-amber-800'
          }`}>
            {row.status}
          </span>
        </div>
      ),
    },
    // 5. Ilovalar
    {
      key: 'attachedFiles',
      header: 'Ilovalar',
      align: 'center',
      render: (row) => {
        const count = row.attachedFiles?.length || 0;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInspectingFraudFiles(row);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mx-auto cursor-pointer border ${
              count > 0 
                ? 'bg-blue-950/70 hover:bg-blue-900 border-blue-800 text-blue-300 shadow-sm shadow-blue-900/30' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Holatga biriktirilgan ilovalarni ko'rish yoki yangi fayl qo'shish"
          >
            <Paperclip className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">{count} ta ilova</span>
            <Plus className="w-3 h-3 text-blue-400" />
          </button>
        );
      },
    },
    // 6. Amallar
    {
      key: 'actions',
      header: 'Amallar',
      sortable: false,
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInspectingFraudFiles(row);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer border border-slate-700"
            title="Tafsilotlar va fayllarni boshqarish"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Ko'rish</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus = row.status === 'Ochiq' ? 'Tergovda' : row.status === 'Tergovda' ? 'Mablag\' to\'xtatilgan' : 'Ochiq';
              updateFraudCaseStatus(row.id, nextStatus);
            }}
            className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title="Statusni yangilash"
          >
            Holat
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with "+ Yangi Firibgarlik Holati Kiritish" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Fraud List
            </h1>
          </div>
        </div>

        {/* Primary Action Button: "yangi qator qo'shish funksiyasi" */}
        <div className="shrink-0">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi Firibgarlik Kiritish</span>
          </button>
        </div>
      </div>

      {/* 4 Requested Top Indicators:
          1. Jami holatlar
          2. Jami zarar
          3. Joriy oydagi holatlar
          4. Joriy oydagi zarar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Jami holatlar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Jami Holatlar</span>
            <FileWarning className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {fraudStats.totalCases} ta
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Kiberxavfsizlikda ochilgan jami ishlar</p>
        </div>

        {/* 2. Jami zarar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Jami Zarar</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums">
              {formatUzs(fraudStats.totalDamage)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Da'vo arizalari bo'yicha umumiy summa</p>
        </div>

        {/* 3. Joriy oydagi holatlar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-blue-300">Joriy Oydagi Holatlar</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-300 tabular-nums">
              {fraudStats.currentMonthCases} ta
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({((fraudStats.currentMonthCases / (fraudStats.totalCases || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Shu oyda qayd etilgan holatlar soni</p>
        </div>

        {/* 4. Joriy oydagi zarar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300">Joriy Oydagi Zarar</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {formatUzs(fraudStats.currentMonthDamage)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Shu oyda yetkazilgan zarar miqdori</p>
        </div>
      </div>

      {/* Davr oralig'i filtri */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Davr oralig'i */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-300 flex items-center gap-1.5 font-semibold">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Davr oralig'i:</span>
            </span>

            <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Boshlanish:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  title="Boshlanish sanasi"
                />
              </div>

              <span className="text-slate-600 font-bold px-0.5">—</span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Tugash:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-md px-2.5 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  title="Tugash sanasi"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer ml-1"
                  title="Davr oralig'ini tozalash"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Tozalash</span>
                </button>
              )}
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="text-[11px] font-mono text-slate-400 ml-auto">
              Topilgan holatlar: <strong className="text-blue-300 font-bold">{filteredCases.length}</strong> ta
            </div>
          )}
        </div>

        {(startDate || endDate) && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>
              Tanlangan davr oralig'i: <strong className="text-blue-300 font-mono">{startDate || 'Boshidan'}</strong> dan <strong className="text-blue-300 font-mono">{endDate || 'Hozirgacha'}</strong> gacha
            </div>
          </div>
        )}
      </div>

      {/* Main DataTable with the 6 Exact Columns */}
      <DataTable
        data={filteredCases}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Jinoyat turi, tasnifi, jabrlanuvchi F.I.O yoki telefon raqami bo'yicha qidirish..."
        searchField={(item) => `${item.caseNumber} ${item.fraudCategory} ${item.victimName} ${item.victimPhone} ${item.fraudTypeAndDescription || ''} ${item.investigatorNotes}`}
        pageSizeDefault={10}
        emptyMessage="Filtr bo'yicha firibgarlik holati topilmadi"
        onRowClick={(row) => setInspectingFraudFiles(row)}
        exportFileName="firibgarlik_holatlari_reyestr.csv"
      />

      {/* Yangi Firibgarlik Holati Kiritish Modali */}
      <ModalDialog
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        ariaLabel="Yangi Firibgarlik Holatini Ro'yxatga Olish"
        maxWidthClass="max-w-2xl"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-lg">
                  <FileWarning className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yangi Firibgarlik Holatini Ro'yxatga Olish</h3>
                  <p className="text-xs text-slate-400">Firibgarlik jinoyati bo'yicha yangi ish ochish va dalillarni biriktirish</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFraudCase} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Jinoyat turi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jinoyat turi / Toifasi <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newCase.fraudCategory}
                    onChange={(e) => setNewCase({ ...newCase, fraudCategory: e.target.value as FraudCaseItem['fraudCategory'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Telegram fishing & Soxta botlar">Telegram fishing & Soxta botlar</option>
                    <option value="Soxta investitsiya & Piramida">Soxta investitsiya & Piramida</option>
                    <option value="Bank ilovasi sessiyasini o'g'irlash">Bank ilovasi sessiyasini o'g'irlash</option>
                    <option value="Drop tarmog'i orqali yuvish">Drop tarmog'i orqali yuvish</option>
                    <option value="Ijtimoiy muhandislik & SMS kod">Ijtimoiy muhandislik & SMS kod</option>
                  </select>
                </div>

                {/* 4. Aniqlangan sana */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aniqlangan sana <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newCase.detectedDate}
                    onChange={(e) => setNewCase({ ...newCase, detectedDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 2. Jabrlanuvchi F.I.O */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jabrlanuvchi F.I.O <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sharipova Gulnoza Rustamovna"
                    value={newCase.victimName}
                    onChange={(e) => setNewCase({ ...newCase, victimName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jabrlanuvchi telefoni
                  </label>
                  <input
                    type="text"
                    value={newCase.victimPhone}
                    onChange={(e) => setNewCase({ ...newCase, victimPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 3. Zarar Summasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Zarar Summasi (UZS) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Masalan: 45000000"
                    value={newCase.totalDamage}
                    onChange={(e) => setNewCase({ ...newCase, totalDamage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Muzlatilgan mablag' */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Muzlatilgan mablag' (UZS)
                  </label>
                  <input
                    type="number"
                    placeholder="Masalan: 38500000"
                    value={newCase.blockedAmount}
                    onChange={(e) => setNewCase({ ...newCase, blockedAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Gumonlanuvchi Drop Karta */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gumonlanuvchi drop karta
                  </label>
                  <input
                    type="text"
                    placeholder="9860 **** **** 4402"
                    value={newCase.suspectDropCard}
                    onChange={(e) => setNewCase({ ...newCase, suspectDropCard: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Holat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ishning holati
                  </label>
                  <select
                    value={newCase.status}
                    onChange={(e) => setNewCase({ ...newCase, status: e.target.value as FraudCaseItem['status'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Ochiq">Ochiq</option>
                    <option value="Tergovda">Tergovda</option>
                    <option value="Mablag' to'xtatilgan">Mablag' to'xtatilgan</option>
                    <option value="Mablag' qaytarildi">Mablag' qaytarildi</option>
                  </select>
                </div>
              </div>

              {/* Turi va Tasnifi batafsil matni */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jinoyat tasnifi va tafsilotlari <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Firibgarlik qanday amalga oshirilganligi, ishlatilgan soxta bot, soxta sayt yoki fishing havolalari haqida ma'lumot..."
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* 5. Ilova fayl kiritish */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ilova hujjatlar / Fayllar biriktirish (Ixtiyoriy)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(Array.from(e.target.files));
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30 cursor-pointer"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                    Tanlangan fayllar: {selectedFiles.map((f) => f.name).join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Holatni Ro'yxatga Olish</span>
                </button>
              </div>
            </form>
        </div>
      </ModalDialog>
    </div>
  );
};
