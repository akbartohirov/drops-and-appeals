import React, { useState, useMemo } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { ModalDialog } from '../components/common/ModalDialog';
import { DropCardItem, CardSystem } from '../types/antifraud';
import { formatUzs } from '../utils/rules';
import { 
  CreditCard, 
  Calendar, 
  Lock, 
  Eye, 
  Plus, 
  X, 
  Check, 
  TrendingDown, 
  RotateCcw,
  User,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const DropCardsListPage: React.FC = () => {
  const { dropCards, setInspectingDropCard, addDropCard, currentUser, updateDropCardStatus } = useAntifraud();

  // Davr oralig'i (period) filtri
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Yangi drop karta qo'shish modal holati
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardHolder: '',
    holderPinfl: '',
    bankName: 'Kapitalbank ATB',
    cardSystem: 'Humo' as CardSystem,
    blockedDate: new Date().toISOString().split('T')[0],
    balanceAmount: '',
    blockingReason: 'P2P tranzit firibgarlik gumoni',
    blockedBy: currentUser ? currentUser.fullName : 'B. Mirzayev (Bosh tahlilchi)',
    status: 'Bloklangan' as DropCardItem['status'],
  });

  // Filtered Cards - faqat Davr oralig'i bo'yicha
  const filteredCards = useMemo(() => {
    return dropCards.filter((card) => {
      const date = card.blockedDate || '';
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  }, [dropCards, startDate, endDate]);

  // Yuqoridagi 4 ta ko'rsatkich:
  // "Yuqorida umumiy bloklangan cardlar soni summasi va joriy oydagi soni summasi"
  const totalBlockedCount = dropCards.length;
  const totalBlockedTurnover = dropCards.reduce((acc, c) => acc + c.totalTurnover, 0);

  const currentMonthCards = dropCards.filter((c) => c.isCurrentMonth);
  const currentMonthCount = currentMonthCards.length;
  const currentMonthTurnover = currentMonthCards.reduce((acc, c) => acc + c.totalTurnover, 0);

  // Handle adding new drop card
  const handleCreateDropCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.cardNumber) return;

    try {
      await addDropCard({
        cardNumber: newCard.cardNumber,
        cardHolder: newCard.cardHolder || "Noma'lum egasi",
        holderPinfl: newCard.holderPinfl || '32004991200045',
        bankName: newCard.bankName,
        cardSystem: newCard.cardSystem,
        blockedDate: newCard.blockedDate || new Date().toISOString().split('T')[0],
        balanceAmount: parseFloat(newCard.balanceAmount) || 0,
        totalTurnover: (parseFloat(newCard.balanceAmount) || 0) * 1.5,
        transactionCount: 12,
        blockingReason: newCard.blockingReason,
        blockedBy: newCard.blockedBy,
        status: newCard.status,
      });

      setIsNewModalOpen(false);
      setNewCard({
        cardNumber: '',
        cardHolder: '',
        holderPinfl: '',
        bankName: 'Kapitalbank ATB',
        cardSystem: 'Humo',
        blockedDate: new Date().toISOString().split('T')[0],
        balanceAmount: '',
        blockingReason: 'P2P tranzit firibgarlik gumoni',
        blockedBy: currentUser ? currentUser.username : 'Operator',
        status: 'Bloklangan',
      });
    } catch (err: any) {
      alert(err?.message || 'Drop kartani saqlashda xatolik!');
    }
  };

  // 8 Exact Columns Requested:
  // 1. Karta raqami
  // 2. Bloklangan sana
  // 3. Qoldiq summasi (UZS)
  // 4. Izoh / Bloklash sababi
  // 5. Bloklagan shaxs
  // 6. Yaratilgan vaqt
  // 7. O'zgartirilgan vaqt
  // 8. Amallar
  const columns: ColumnDef<DropCardItem>[] = [
    // 1. Karta raqami
    {
      key: 'cardNumber',
      header: 'Karta raqami',
      render: (row) => (
        <div className="min-w-[150px]">
          <span className="font-mono text-xs font-bold text-slate-100 block tracking-wider">
            {row.maskedCardNumber || row.cardNumber}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
              row.cardSystem === 'Humo' 
                ? 'bg-amber-950/60 text-amber-400 border-amber-800/60' 
                : 'bg-blue-950/60 text-blue-400 border-blue-800/60'
            }`}>
              {row.cardSystem}
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[110px]" title={row.bankName}>
              {row.bankName}
            </span>
          </div>
        </div>
      ),
    },
    // 2. Bloklangan sana
    {
      key: 'blockedDate',
      header: 'Bloklangan sana',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
          {row.blockedDate}
        </span>
      ),
    },
    // 3. Qoldiq summasi (UZS)
    {
      key: 'balanceAmount',
      header: 'Qoldiq summasi (UZS)',
      align: 'right',
      render: (row) => (
        <div className="text-right whitespace-nowrap">
          <span className="font-mono text-xs font-bold text-red-400 block tabular-nums">
            {formatUzs(row.balanceAmount || 0)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Aylanma: {formatUzs(row.totalTurnover)}
          </span>
        </div>
      ),
    },
    // 4. Izoh / Bloklash sababi
    {
      key: 'blockingReason',
      header: 'Izoh / Bloklash sababi',
      render: (row) => (
        <div className="max-w-[240px]">
          <span className="text-xs text-slate-200 block truncate font-medium" title={row.blockingReason || row.notes || row.dropPatternType}>
            {row.blockingReason || row.notes || row.dropPatternType}
          </span>
          <span className="text-[10px] text-amber-400/90 font-mono block truncate">
            {row.dropPatternType}
          </span>
        </div>
      ),
    },
    // 5. Bloklagan shaxs
    {
      key: 'blockedBy',
      header: 'Bloklagan shaxs',
      render: (row) => (
        <div className="min-w-[130px]">
          <span className="text-xs text-slate-200 block truncate font-medium" title={row.blockedBy || 'B. Mirzayev (Operator)'}>
            {row.blockedBy || 'B. Mirzayev (Operator)'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Xavfsizlik inspektori</span>
        </div>
      ),
    },
    // 6. Yaratilgan vaqt
    {
      key: 'createdAtTime',
      header: 'Yaratilgan vaqt',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
          {row.createdAtTime || `${row.blockedDate} 09:00:00`}
        </span>
      ),
    },
    // 7. O'zgartirilgan vaqt
    {
      key: 'updatedAtTime',
      header: "O'zgartirilgan vaqt",
      render: (row) => (
        <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
          {row.updatedAtTime || `${row.blockedDate} 10:30:00`}
        </span>
      ),
    },
    // 8. Amallar
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
              setInspectingDropCard(row);
            }}
            className="px-2.5 py-1 rounded-md bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 text-blue-300 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Karta to'liq dosyesini ko'rish"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Dossye</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus = row.status === 'Bloklangan' ? 'Vaqtincha cheklangan' : 'Bloklangan';
              updateDropCardStatus(row.id, nextStatus);
            }}
            className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
              row.status === 'Bloklangan'
                ? 'bg-red-950/60 hover:bg-red-900/70 border-red-800 text-red-300'
                : 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-800 text-emerald-300'
            }`}
            title="Blokirovka holatini o'zgartirish"
          >
            {row.status === 'Bloklangan' ? 'Blokda' : row.status}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with "+ Yangi Drop Karta Kiritish" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Drop kartalar (Drop cards list)
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
            <span>Yangi Drop Karta Kiritish</span>
          </button>
        </div>
      </div>

      {/* 4 Mandatory Requested Indicators:
          "Yuqorida umumiy bloklangan cardlar soni summasi va joriy oydagi soni summasi" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Blocked Cards Count */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Umumiy Bloklangan Kartalar</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalBlockedCount} ta
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Tizim bo'yicha jami bloklangan kartalar soni</p>
        </div>

        {/* Total Blocked Turnover */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Umumiy Bloklangan Summa</span>
            <CreditCard className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums">
              {formatUzs(totalBlockedTurnover)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Drop kartalar orqali o'tgan umumiy aylanma</p>
        </div>

        {/* Current Month Blocked Cards Count */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-blue-300">Joriy Oydagi Kartalar Soni</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-300 tabular-nums">
              {currentMonthCount} ta
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({((currentMonthCount / (totalBlockedCount || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">2026-yil Oktyabr oyida bloklanganlar</p>
        </div>

        {/* Current Month Blocked Turnover */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300">Joriy Oydagi Summa</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {formatUzs(currentMonthTurnover)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Shu oyda aniqlangan shubhali pul aylanmasi</p>
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
              Topilgan drop kartalar: <strong className="text-blue-300 font-bold">{filteredCards.length}</strong> ta
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

      {/* Main DataTable with the 8 Exact Columns */}
      <DataTable
        data={filteredCards}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Karta raqami, bloklash sababi, shaxs yoki bank bo'yicha qidirish..."
        searchField={(item) => `${item.cardNumber} ${item.maskedCardNumber} ${item.blockingReason} ${item.blockedBy} ${item.cardHolder} ${item.bankName}`}
        pageSizeDefault={10}
        emptyMessage="Filtr bo'yicha bloklangan drop karta topilmadi"
        onRowClick={(row) => setInspectingDropCard(row)}
        exportFileName="drop_kartalar_antifrod_reyestr.csv"
      />

      {/* Yangi Drop Karta Kiritish Modali */}
      <ModalDialog
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        ariaLabel="Yangi Drop Karta Kiritish"
        maxWidthClass="max-w-2xl"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-600/20 text-red-400 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yangi Drop Karta Kiritish</h3>
                  <p className="text-xs text-slate-400">Bloklangan shubhali kartani tizim reyestriga ro'yxatga olish</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDropCard} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Karta raqami */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Karta raqami <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9860 0000 0000 0000"
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 2. Bloklangan sana */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bloklangan sana <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newCard.blockedDate}
                    onChange={(e) => setNewCard({ ...newCard, blockedDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 3. Qoldiq summasi (UZS) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Qoldiq summasi (UZS)
                  </label>
                  <input
                    type="number"
                    placeholder="Masalan: 12500000"
                    value={newCard.balanceAmount}
                    onChange={(e) => setNewCard({ ...newCard, balanceAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* 5. Bloklagan shaxs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bloklagan shaxs
                  </label>
                  <input
                    type="text"
                    value={newCard.blockedBy}
                    onChange={(e) => setNewCard({ ...newCard, blockedBy: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Bank va Tizim */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tashkilot / Bank
                  </label>
                  <select
                    value={newCard.bankName}
                    onChange={(e) => setNewCard({ ...newCard, bankName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    To'lov tizimi
                  </label>
                  <select
                    value={newCard.cardSystem}
                    onChange={(e) => setNewCard({ ...newCard, cardSystem: e.target.value as CardSystem })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Humo">Humo</option>
                    <option value="Uzcard">Uzcard</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>

                {/* Karta egasi F.I.O */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Karta egasi F.I.O
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Sobirov Jasur Nodirovich"
                    value={newCard.cardHolder}
                    onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Holati */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Boshlang'ich holati
                  </label>
                  <select
                    value={newCard.status}
                    onChange={(e) => setNewCard({ ...newCard, status: e.target.value as DropCardItem['status'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Bloklangan">Bloklangan</option>
                    <option value="Vaqtincha cheklangan">Vaqtincha cheklangan</option>
                    <option value="Muzlatilgan">Muzlatilgan</option>
                    <option value="Sud/IIBga yuborilgan">Sud/IIBga yuborilgan</option>
                  </select>
                </div>
              </div>

              {/* 4. Izoh / Bloklash sababi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Izoh / Bloklash sababi <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Drop kartani bloklash asosi, anomal o'tkazmalar zanjiri yoki IIB so'rovi..."
                  value={newCard.blockingReason}
                  onChange={(e) => setNewCard({ ...newCard, blockingReason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
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
                  <span>Kiritish va Saqlash</span>
                </button>
              </div>
            </form>
        </div>
      </ModalDialog>
    </div>
  );
};
