import React, { useState, useMemo } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { ModalDialog } from '../components/common/ModalDialog';
import { AppealItem, CardSystem } from '../types/antifraud';
import { formatUzs, calculateAppealStats } from '../utils/rules';
import { 
  Inbox, 
  Calendar, 
  Plus, 
  Eye, 
  X, 
  Check, 
  TrendingDown, 
  Building2, 
  Phone, 
  MapPin, 
  CreditCard, 
  User, 
  Clock, 
  FileText,
  RotateCcw
} from 'lucide-react';

export const AppealsListPage: React.FC = () => {
  const { appeals, setInspectingAppeal, addAppeal } = useAntifraud();

  // Davr oralig'i (period) filtri
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // New appeal modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newApplicant, setNewApplicant] = useState({
    applicantName: '',
    address: '',
    applicantPhone: '+998 ',
    organization: 'Kapitalbank ATB',
    cardSystem: 'Humo' as CardSystem,
    direction: 'P2P Firibgarlik da\'vosi',
    clientCode: '',
    cardNumber: '',
    incidentDate: '2026-10-25',
    damageAmount: '',
    description: '',
  });

  // Calculate top 4 metrics based on all current appeals in the system:
  // 1. Barcha murojaatlar
  // 2. Joriy oydagi ko'rsatkichlar
  // 3. Umumiy zarar summasi
  // 4. Joriy oydagi zarar summasi
  const overallStats = useMemo(() => {
    return calculateAppealStats(appeals);
  }, [appeals]);

  // Filter appeals for the table - faqat Davr oralig'i bo'yicha
  const filteredAppeals = useMemo(() => {
    return appeals.filter((item) => {
      const date = item.incidentDate || item.createdAt || '';

      // Davr oralig'i filtri (Period)
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;

      return true;
    });
  }, [appeals, startDate, endDate]);

  // Handle creating new appeal
  const handleCreateAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApplicant.applicantName || !newApplicant.cardNumber) return;

    try {
      await addAppeal({
        applicantName: newApplicant.applicantName,
        address: newApplicant.address || 'Toshkent sh.',
        applicantPhone: newApplicant.applicantPhone,
        organization: newApplicant.organization,
        cardSystem: newApplicant.cardSystem,
        direction: newApplicant.direction,
        clientCode: newApplicant.clientCode || `CIF-${Math.floor(100000 + Math.random() * 900000)}`,
        cardNumber: newApplicant.cardNumber,
        incidentDate: newApplicant.incidentDate || new Date().toISOString().split('T')[0],
        damageAmount: parseFloat(newApplicant.damageAmount) || 0,
        description: newApplicant.description,
        status: 'Yangi',
        priority: 'Muhim',
      });

      setIsNewModalOpen(false);
      setNewApplicant({
        applicantName: '',
        address: '',
        applicantPhone: '+998 ',
        organization: 'Kapitalbank ATB',
        cardSystem: 'Humo',
        direction: "P2P Firibgarlik da'vosi",
        clientCode: '',
        cardNumber: '',
        incidentDate: new Date().toISOString().split('T')[0],
        damageAmount: '',
        description: '',
      });
    } catch (err: any) {
      alert(err?.message || 'Murojaatni saqlashda xatolik!');
    }
  };

  // 14 Table Columns
  const columns: ColumnDef<AppealItem>[] = [
    // 1. Murojaatchi (FISH)
    {
      key: 'applicantName',
      header: 'Murojaatchi',
      render: (row) => (
        <div className="min-w-[140px]">
          <span className="font-semibold text-slate-100 text-xs block truncate" title={row.applicantName}>
            {row.applicantName}
          </span>
          <span className="text-[10px] font-mono text-blue-400">{row.appealNumber}</span>
        </div>
      ),
    },
    // 2. Manzil
    {
      key: 'address',
      header: 'Manzil',
      render: (row) => (
        <span className="text-xs text-slate-400 block max-w-[160px] truncate" title={row.address}>
          {row.address || 'Ko\'rsatilmagan'}
        </span>
      ),
    },
    // 3. Telefon
    {
      key: 'applicantPhone',
      header: 'Telefon',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
          {row.applicantPhone}
        </span>
      ),
    },
    // 4. Tashkilot
    {
      key: 'organization',
      header: 'Tashkilot',
      render: (row) => (
        <span className="text-xs text-slate-200 font-medium block max-w-[150px] truncate" title={row.organization || row.bankName}>
          {row.organization || row.bankName}
        </span>
      ),
    },
    // 5. Tizim
    {
      key: 'cardSystem',
      header: 'Tizim',
      align: 'center',
      render: (row) => (
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
          row.cardSystem === 'Humo'
            ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
            : row.cardSystem === 'Uzcard'
            ? 'bg-blue-950/60 text-blue-300 border-blue-800/80'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          {row.cardSystem}
        </span>
      ),
    },
    // 6. Yo'nalish
    {
      key: 'direction',
      header: 'Yo\'nalish',
      render: (row) => (
        <span className="text-xs text-slate-300 block max-w-[170px] truncate" title={row.direction || row.appealType}>
          {row.direction || row.appealType}
        </span>
      ),
    },
    // 7. Mijoz kodi
    {
      key: 'clientCode',
      header: 'Mijoz kodi',
      render: (row) => (
        <span className="font-mono text-xs text-purple-300 whitespace-nowrap">
          {row.clientCode || 'CIF-000000'}
        </span>
      ),
    },
    // 8. Karta raqami
    {
      key: 'cardNumber',
      header: 'Karta raqami',
      render: (row) => (
        <span className="font-mono text-xs text-slate-200 font-semibold whitespace-nowrap">
          {row.cardNumber}
        </span>
      ),
    },
    // 9. Sana
    {
      key: 'incidentDate',
      header: 'Sana',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
          {row.incidentDate || row.createdAt}
        </span>
      ),
    },
    // 10. Yaratuvchi
    {
      key: 'creator',
      header: 'Yaratuvchi',
      render: (row) => (
        <span className="text-xs text-slate-400 block max-w-[130px] truncate" title={row.creator || row.assignedOfficer}>
          {row.creator || row.assignedOfficer || 'Tizim'}
        </span>
      ),
    },
    // 11. Yaratilgan vaqt
    {
      key: 'createdAtTime',
      header: 'Yaratilgan vaqt',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
          {row.createdAtTime || `${row.incidentDate} 09:00:00`}
        </span>
      ),
    },
    // 12. O'zgartirilgan vaqt
    {
      key: 'updatedAtTime',
      header: 'O\'zgartirilgan vaqt',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
          {row.updatedAtTime || `${row.incidentDate} 10:00:00`}
        </span>
      ),
    },
    // 13. Zarar summasi
    {
      key: 'damageAmount',
      header: 'Zarar summasi',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-amber-400 tabular-nums whitespace-nowrap">
          {formatUzs(row.damageAmount || row.amount || 0)}
        </span>
      ),
    },
    // 14. Amallar
    {
      key: 'actions',
      header: 'Amallar',
      sortable: false,
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInspectingAppeal(row);
          }}
          className="px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-xs font-medium transition-colors flex items-center gap-1 mx-auto whitespace-nowrap"
          title="Ko'rib chiqish va xulosa qilish"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ko'rish</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Section with '+ Yangi murojaat kiritish' Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Murojaatlar Ro'yxati
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
              Reyestr
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mijozlarning shubhali o'tkazmalar, asossiz blokirovka va kiber-firibgarlik bo'yicha e'tiroz va arizalari
          </p>
        </div>

        {/* Primary Action Button: "Eng yuqori qismida yangi murojaat kirish tugmasi bo'lishi kerak" */}
        <div className="shrink-0">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi Murojaat Kiritish</span>
          </button>
        </div>
      </div>

      {/* 4 Requested Top Indicators:
          1. Barcha murojaatlar
          2. Joriy oydagi ko'rsatkichlar
          3. Umumiy zarar summasi
          4. Joriy oydagi zarar summasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Barcha murojaatlar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Barcha Murojaatlar</span>
            <Inbox className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {overallStats.totalCount} ta
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Tizimga kelib tushgan jami arizalar</p>
        </div>

        {/* 2. Joriy oydagi ko'rsatkichlar */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-blue-300">Joriy Oydagi Ko'rsatkichlar</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-300 tabular-nums">
              {overallStats.currentMonthCount} ta
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({((overallStats.currentMonthCount / (overallStats.totalCount || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Shu oyda qayd etilgan murojaatlar soni</p>
        </div>

        {/* 3. Umumiy zarar summasi */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300">Umumiy Zarar Summasi</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {formatUzs(overallStats.totalDamage)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Barcha murojaatlar bo'yicha umumiy da'vo</p>
        </div>

        {/* 4. Joriy oydagi zarar summasi */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-red-400">Joriy Oydagi Zarar Summasi</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums">
              {formatUzs(overallStats.currentMonthDamage)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">2026-yil Oktyabr oyi bo'yicha da'vo summasi</p>
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
              Topilgan murojaatlar: <strong className="text-blue-300 font-bold">{filteredAppeals.length}</strong> ta
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

      {/* Main DataTable with all 14 Columns */}
      <DataTable
        data={filteredAppeals}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Murojaatchi, telefon, karta raqami, manzil yoki mijoz kodi bo'yicha qidirish..."
        searchField={(item) => `${item.applicantName} ${item.address} ${item.applicantPhone} ${item.organization} ${item.clientCode} ${item.cardNumber} ${item.appealNumber} ${item.direction}`}
        pageSizeDefault={10}
        emptyMessage="Filtr bo'yicha murojaat topilmadi"
        onRowClick={(row) => setInspectingAppeal(row)}
        exportFileName="murojaatlar_antifrod_reyestr.csv"
      />

      {/* =========================================================================
          MODAL: Yangi Murojaat Kiritish (Eng yuqori qismdagi tugma orqali)
          ========================================================================= */}
      <ModalDialog
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        ariaLabel="Yangi Murojaat Kiritish"
        maxWidthClass="max-w-2xl"
      >
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yangi Murojaat Kiritish</h3>
                  <p className="text-xs text-slate-400">Antifrod tizimiga mijoz arizasi yoki da'vosini ro'yxatga olish</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAppeal} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Murojaatchi FISH */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Murojaatchi (FISH) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Karimova Shahlo Anvarovna"
                    value={newApplicant.applicantName}
                    onChange={(e) => setNewApplicant({ ...newApplicant, applicantName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 3. Telefon */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    <span>Telefon raqami *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998 (90) 123-45-67"
                    value={newApplicant.applicantPhone}
                    onChange={(e) => setNewApplicant({ ...newApplicant, applicantPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 2. Manzil */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Manzil (Hudud, tuman, ko'cha) *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Toshkent sh., Chilonzor t., 19-mavze, 44-uy"
                  value={newApplicant.address}
                  onChange={(e) => setNewApplicant({ ...newApplicant, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 4. Tashkilot */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Tashkilot (Bank) *</span>
                  </label>
                  <select
                    value={newApplicant.organization}
                    onChange={(e) => setNewApplicant({ ...newApplicant, organization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Kapitalbank ATB">Kapitalbank ATB</option>
                    <option value="TBC Bank ATB">TBC Bank ATB</option>
                    <option value="Ipak Yo'li Banki AITB">Ipak Yo'li Banki AITB</option>
                    <option value="SQB (O'zsanoatqurilishbank)">SQB</option>
                    <option value="Agrobank ATB">Agrobank ATB</option>
                    <option value="Milliy Bank (NBU)">Milliy Bank (NBU)</option>
                    <option value="Anorbank AJ">Anorbank AJ</option>
                    <option value="Hamkorbank ATB">Hamkorbank ATB</option>
                    <option value="Xalq Banki ATB">Xalq Banki ATB</option>
                  </select>
                </div>

                {/* 5. Tizim */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>To'lov Tizimi *</span>
                  </label>
                  <select
                    value={newApplicant.cardSystem}
                    onChange={(e) => setNewApplicant({ ...newApplicant, cardSystem: e.target.value as CardSystem })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Humo">Humo</option>
                    <option value="Uzcard">Uzcard</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 6. Yo'nalish */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Yo'nalish (Murojaat turi) *</label>
                  <select
                    value={newApplicant.direction}
                    onChange={(e) => setNewApplicant({ ...newApplicant, direction: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="P2P Firibgarlik da'vosi">P2P Firibgarlik da'vosi</option>
                    <option value="Karta asossiz bloklanishi">Karta asossiz bloklanishi</option>
                    <option value="Drop hisobiga adashib tushgan mablag'">Drop hisobiga adashib tushgan mablag'</option>
                    <option value="Ruxsatsiz yechib olish">Ruxsatsiz yechib olish</option>
                    <option value="Fishing havola orqali mablag' o'g'irlanishi">Fishing havola orqali o'g'irlanish</option>
                    <option value="Bankomat operatsiyasi e'tirozi">Bankomat operatsiyasi e'tirozi</option>
                  </select>
                </div>

                {/* 7. Mijoz kodi */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Mijoz Kodi (CIF / PINFL)</label>
                  <input
                    type="text"
                    placeholder="Masalan: CIF-891042"
                    value={newApplicant.clientCode}
                    onChange={(e) => setNewApplicant({ ...newApplicant, clientCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 8. Karta raqami */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-slate-300 font-semibold">Karta raqami *</label>
                  <input
                    type="text"
                    required
                    placeholder="9860 1234 5678 9012"
                    value={newApplicant.cardNumber}
                    onChange={(e) => setNewApplicant({ ...newApplicant, cardNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 9. Sana */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-slate-300 font-semibold">Voqea sanasi *</label>
                  <input
                    type="date"
                    required
                    value={newApplicant.incidentDate}
                    onChange={(e) => setNewApplicant({ ...newApplicant, incidentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 13. Zarar summasi */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-slate-300 font-semibold">Zarar summasi (UZS) *</label>
                  <input
                    type="number"
                    required
                    placeholder="15 000 000"
                    value={newApplicant.damageAmount}
                    onChange={(e) => setNewApplicant({ ...newApplicant, damageAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tavsif */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Murojaat bayonoti va tafsilotlari</label>
                <textarea
                  rows={3}
                  placeholder="Mijoz arizasida ko'rsatilgan holat bayoni..."
                  value={newApplicant.description}
                  onChange={(e) => setNewApplicant({ ...newApplicant, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Murojaatni Saqlash
                </button>
              </div>
            </form>
        </div>
      </ModalDialog>
    </div>
  );
};
