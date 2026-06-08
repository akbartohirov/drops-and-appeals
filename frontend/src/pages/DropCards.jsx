import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import ExcelExport from '../components/ExcelExport';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Calendar,
  Eye,
  CheckCircle,
  CreditCard,
  User,
  AlertOctagon,
  TrendingUp,
  Percent,
  Wallet,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

const DropCards = () => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Statistics State
  const [totalBlockedAmount, setTotalBlockedAmount] = useState(0);
  const [currentMonthBlockedCount, setCurrentMonthBlockedCount] = useState(0);
  const [currentMonthBlockedAmount, setCurrentMonthBlockedAmount] = useState(0);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Form Fields State
  const [formCard, setFormCard] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formHolder, setFormHolder] = useState('');
  const [formBalance, setFormBalance] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formComment, setFormComment] = useState('');

  // Load cards database
  const fetchCards = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await apiService.getDropCards({
        page,
        limit,
        search: searchTerm,
        startDate,
        endDate
      });
      setCards(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCurrentMonthBlockedCount(res.stats.currentMonthBlockedCount);
      setCurrentMonthBlockedAmount(res.stats.currentMonthBlockedAmount || 0);
      setTotalBlockedAmount(res.stats.totalFilteredAmount);
      setLoading(false);
    } catch (err) {
      console.error("Drop kartalarni yuklashda xato:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchCards(1, pageSize);
  }, [searchTerm, startDate, endDate, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchCards(newPage, pageSize);
  };

  // Format Card Number (spaced)
  const formatCardSpaced = (num) => {
    const clean = num.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < clean.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += clean[i];
    }
    return formatted;
  };

  const handleCardChange = (e) => {
    const formatted = formatCardSpaced(e.target.value);
    setFormCard(formatted);
  };

  // Determine card type based on raw card number
  const getCardTypeInfo = (cardNumber) => {
    if (cardNumber.startsWith('8600')) {
      return { name: 'Humo', color: 'bg-primary text-yellow-400', label: 'Humo • Jismoniy shaxs' };
    }
    if (cardNumber.startsWith('5614') || cardNumber.startsWith('9860')) {
      return { name: 'UzCard', color: 'bg-blue-700 text-white', label: 'UzCard • Korporativ' };
    }
    if (cardNumber.startsWith('4')) {
      return { name: 'Visa', color: 'bg-slate-800 text-slate-100', label: 'Visa Platinum • Jismoniy' };
    }
    return { name: 'Boshqa', color: 'bg-secondary text-white', label: 'Bank kartasi • Jismoniy' };
  };

  // Handle Form Submit (Add Blocked Card)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeUser = JSON.parse(localStorage.getItem('active_user') || '{}');

    const newCard = {
      cardNumber: formCard.replace(/\s/g, ''),
      blockDate: formDate,
      holderName: "Noma'lum Jismoniy shaxs", // Default since field is removed per UI request
      balance: Number(formBalance) || 0,
      reason: "boshqa", // Default since field is removed per UI request
      comment: formComment,
      operatorId: activeUser.id || 2
    };

    try {
      await apiService.createDropCard(newCard);
      setIsAddModalOpen(false);

      // Reset fields
      setFormCard('');
      setFormHolder('');
      setFormBalance('');
      setFormReason('');
      setFormComment('');
      setFormDate(new Date().toISOString().split('T')[0]);

      // Show success modal
      setIsSuccessModalOpen(true);

      // Reload database
      setCurrentPage(1);
      await fetchCards(1, pageSize);
    } catch (err) {
      alert("Drop kartani qo'shishda xatolik: " + err.message);
    }
  };

  const openDetail = (card) => {
    setSelectedCard(card);
    setIsDetailModalOpen(true);
  };

  // Excel headers
  const excelHeaders = [
    { label: 'Karta raqami', key: 'cardNumber', format: (val) => formatCardSpaced(val) },
    { label: 'Karta turi', key: 'cardNumber', format: (val) => getCardTypeInfo(val).name },
    { label: 'Foydalanuvchi F.I.O', key: 'holderName' },
    { label: 'Bloklangan sana', key: 'blockDate' },
    { label: 'Bloklangan vaqt', key: 'blockTime' },
    { label: 'Qoldiq summasi', key: 'balance', format: (val) => Number(val).toLocaleString('uz-UZ') + ' UZS' },
    {
      label: 'Sababi', key: 'reason', format: (val) =>
        val === 'shubhali' ? 'Shubhali tranzaksiya' :
          val === 'kredit' ? 'Kredit firibgarligi' :
            val === 'huquq' ? 'Huquqni muhofaza qilish organi so\'rovi' : 'Boshqa'
    },
    { label: 'Izoh', key: 'comment' }
  ];

  return (
    <div className="space-y-stack-lg animate-slide-up font-body-md">
      {/* Top Header Section */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg font-bold text-primary">Drop kartalar reyestri</h1>
        </div>
        <div className="flex gap-3">
          <ExcelExport
            data={async () => {
              const res = await apiService.getDropCards({
                limit: 'all'
              });
              return res.data;
            }}
            headers={excelHeaders}
            filename="Drop_Kartalar_Reyestri"
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Yangi qo'shish</span>
          </button>
        </div>
      </div>

      {/* Stats Row (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm card-hover-effect">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-on-surface-variant font-label-md text-label-md mb-1">Jami bloklangan</p>
              <h3 className="text-display-md font-display-md text-primary font-bold">{totalItems} ta</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm card-hover-effect">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-on-surface-variant font-label-md text-label-md mb-1">Jami bloklangan qoldiq</p>
              <h3 className="text-display-md font-display-md text-emerald-600 font-bold">
                {totalBlockedAmount >= 1000000
                  ? `${(totalBlockedAmount / 1000000).toFixed(1)}M UZS`
                  : `${totalBlockedAmount.toLocaleString('uz-UZ')} UZS`}
              </h3>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm card-hover-effect">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-on-surface-variant font-label-md text-label-md mb-1">Joriy oyda bloklangan</p>
              <h3 className="text-display-md font-display-md text-amber-500 font-bold">{currentMonthBlockedCount} ta</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm card-hover-effect">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-on-surface-variant font-label-md text-label-md mb-1">Joriy oy bloklangan qoldiq</p>
              <h3 className="text-display-md font-display-md text-indigo-600 font-bold">
                {currentMonthBlockedAmount >= 1000000
                  ? `${(currentMonthBlockedAmount / 1000000).toFixed(1)}M UZS`
                  : `${currentMonthBlockedAmount.toLocaleString('uz-UZ')} UZS`}
              </h3>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Table search & Date filter Bar */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Karta raqami yoki izoh..."
                className="w-full border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 select-none flex-wrap">
            <span className="text-body-md text-on-surface-variant flex items-center gap-1"><Calendar className="w-4 h-4 text-outline" /> Bloklangan sana:</span>
            <div className="flex items-center bg-surface-container rounded-lg p-1 border border-outline-variant/30 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 p-1 cursor-pointer"
              />
              <span className="text-outline-variant mx-1">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 p-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <svg className="animate-spin h-8 w-8 text-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-outline font-medium">Drop kartalar yuklanmoqda...</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant font-medium text-sm">
              <CreditCard className="w-12 h-12 text-outline-variant mx-auto mb-4" />
              Bloklangan kartalar topilmadi! Qidiruv shartlarini o'zgartirib ko'ring.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] uppercase text-on-surface-variant font-bold border-b border-outline-variant">
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">Karta raqami</th>
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">Bloklangan sana</th>
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">Qoldiq summasi (UZS)</th>
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">Izoh / Bloklash sababi</th>
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">Bloklagan shaxs</th>
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">Yaratilgan vaqt</th>
                  <th className="px-6 py-4 border-b border-outline-variant whitespace-nowrap">O'zgartirilgan vaqt</th>
                  <th className="px-6 py-4 border-b border-outline-variant text-right whitespace-nowrap">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-body-md">
                {cards.map((card, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-surface-container-low/30 transition-colors zebra-row">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-code-sm text-code-sm text-primary font-bold font-mono">
                          {formatCardSpaced(card.cardNumber)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-on-surface font-semibold">{card.blockDate}</p>
                        <p className="text-[10px] text-outline font-mono leading-none">{card.blockTime}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface whitespace-nowrap">
                        {card.balance.toLocaleString('uz-UZ')} UZS
                      </td>
                      <td className="px-6 py-4 max-w-[240px] truncate text-on-surface-variant">
                        {card.reason === 'shubhali' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase select-none">
                            Shubhali tranzaksiya
                          </span>
                        )}
                        {card.reason === 'kredit' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase select-none">
                            Kredit firibgarligi
                          </span>
                        )}
                        {card.reason === 'huquq' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-fixed text-primary uppercase select-none">
                            Organ so'rovi
                          </span>
                        )}
                        {card.reason === 'boshqa' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-container uppercase select-none">
                            Boshqa
                          </span>
                        )}
                        <span className="ml-2 text-xs text-outline italic" title={card.comment}>
                          {card.comment ? `"${card.comment}"` : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap font-semibold text-primary">
                        {card.creatorName || 'Noma\'lum'}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-mono whitespace-nowrap">
                        {card.createdAt || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-mono whitespace-nowrap">
                        {card.updatedAt || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openDetail(card)}
                          className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all duration-200 active:scale-90"
                          title="Tafsilotlarni ko'rish"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table footer with pagination info and controls */}
        {!loading && totalItems > 0 && (
          <div className="px-6 py-4 bg-surface-container-low/50 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-on-surface-variant">
            <div className="flex items-center gap-4">
              <span>
                Ko'rsatilmoqda: {((currentPage - 1) * pageSize) + 1}-
                {Math.min(currentPage * pageSize, totalItems)} dan {totalItems} ta karta
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-outline">Sahifada:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    setPageSize(newSize);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-outline-variant/60 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer text-primary font-bold"
                >
                  <option value={5}>5 ta</option>
                  <option value={10}>10 ta</option>
                  <option value={20}>20 ta</option>
                  <option value={50}>50 ta</option>
                </select>
              </div>
            </div>

            {/* Premium Pagination Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-outline-variant/60 text-primary hover:bg-primary/5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                title="Avvalgi sahifa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered page buttons */}
              {(() => {
                const buttons = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                if (startPage > 1) {
                  buttons.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${currentPage === 1
                          ? 'bg-primary text-white shadow-sm font-extrabold'
                          : 'text-on-surface-variant hover:bg-primary/5'
                        }`}
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    buttons.push(<span key="start-ellipsis" className="px-1 text-outline">...</span>);
                  }
                }

                for (let p = startPage; p <= endPage; p++) {
                  buttons.push(
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${currentPage === p
                          ? 'bg-primary text-white shadow-sm font-extrabold'
                          : 'text-on-surface-variant hover:bg-primary/5'
                        }`}
                    >
                      {p}
                    </button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    buttons.push(<span key="end-ellipsis" className="px-1 text-outline">...</span>);
                  }
                  buttons.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${currentPage === totalPages
                          ? 'bg-primary text-white shadow-sm font-extrabold'
                          : 'text-on-surface-variant hover:bg-primary/5'
                        }`}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return buttons;
              })()}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-outline-variant/60 text-primary hover:bg-primary/5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                title="Keyingi sahifa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: YANGI DROP KARTA BLOKLASH */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yangi drop karta kiritish"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Karta raqami */}
            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md text-on-surface-variant">Karta raqami</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
                <input
                  type="text"
                  required
                  value={formCard}
                  onChange={handleCardChange}
                  placeholder="8600 1234 5678 9012"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md font-mono placeholder:text-outline-variant"
                />
              </div>
            </div>

            {/* Sana */}
            <div className="space-y-1.5">
              <label className="block font-label-md text-label-md text-on-surface-variant">Sana</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline-variant" />
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
                />
              </div>
            </div>

            {/* Qoldiq (UZS) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-label-md text-label-md text-on-surface-variant">Qoldiq (UZS)</label>
              <div className="relative">
                <input
                  type="number"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  placeholder="0 (agar balans yo'q bo'lsa)"
                  className="w-full pl-4 pr-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
                />
              </div>
            </div>

            {/* Izoh */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block font-label-md text-label-md text-on-surface-variant">Izoh</label>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Qo'shimcha bloklash ma'lumotlari..."
                rows="3"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-8 py-6 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3 rounded-b-xl -mx-6 -mb-6">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 py-2.5 rounded-lg border border-primary text-primary font-label-md text-label-md hover:bg-primary-fixed transition-all active:scale-95"
              type="button"
            >
              Bekor qilish
            </button>
            <button
              className="px-10 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary-container shadow-sm transition-all active:scale-95 font-semibold"
              type="submit"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TAFSILOTLARNI KO'RISH */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Bloklangan Karta Tafsilotlari"
        maxWidth="max-w-md"
      >
        {selectedCard && (
          <div className="space-y-6 text-on-surface font-body-md">
            {/* Card representation visually matches a premium bank card */}
            <div className={`p-6 ${getCardTypeInfo(selectedCard.cardNumber).color} rounded-2xl border border-outline-variant/30 flex flex-col justify-between h-44 shadow-md select-none`}>
              <div className="flex justify-between items-start">
                <span className="font-bold text-xs uppercase tracking-widest opacity-80">
                  {getCardTypeInfo(selectedCard.cardNumber).name} Platinum
                </span>
                <span className="font-medium text-[9px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Restricted
                </span>
              </div>

              <div className="font-mono text-xl font-bold tracking-widest text-center my-2 text-white">
                {formatCardSpaced(selectedCard.cardNumber)}
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[8px] uppercase opacity-70 leading-none mb-1">Holder Name</p>
                  <p className="font-semibold text-xs truncate max-w-[180px]">{selectedCard.holderName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase opacity-70 leading-none mb-1">Block Date</p>
                  <p className="font-semibold font-mono text-xs">{selectedCard.blockDate}</p>
                </div>
              </div>
            </div>

            {/* Structured details list */}
            <div className="divide-y divide-outline-variant/30 text-sm border-t border-b border-outline-variant/40">
              <div className="flex justify-between py-3">
                <span className="text-outline font-semibold">Qoldiq mablag':</span>
                <span className="font-bold text-primary">{selectedCard.balance.toLocaleString('uz-UZ')} UZS</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-outline font-semibold">Bloklangan vaqti:</span>
                <span className="font-semibold font-mono">{selectedCard.blockTime}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-outline font-semibold">Bloklash sababi:</span>
                <span className="font-bold text-error">
                  {selectedCard.reason === 'shubhali' ? 'Shubhali tranzaksiya' :
                    selectedCard.reason === 'kredit' ? 'Kredit firibgarligi' :
                      selectedCard.reason === 'huquq' ? 'Organ so\'rovi' : 'Boshqa'}
                </span>
              </div>
              {selectedCard.comment && (
                <div className="py-3.5 space-y-1 bg-surface-container-low/50 px-3 rounded-lg border border-outline-variant/30 my-2">
                  <span className="text-xs text-outline font-semibold block uppercase tracking-wider">Boshqaruvchi Izohi:</span>
                  <p className="text-xs text-on-surface-variant italic leading-normal">"{selectedCard.comment}"</p>
                </div>
              )}
              <div className="py-4 space-y-3 border-t border-outline-variant/30 mt-2">
                <h5 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  Tizim ma'lumotlari
                </h5>
                <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container-low/30 p-3 rounded-lg border border-outline-variant/20">
                  <div className="space-y-1">
                    <span className="text-[10px] text-outline font-semibold uppercase flex items-center gap-1"><User className="w-3 h-3" /> Bloklagan shaxs</span>
                    <p className="font-semibold text-on-surface">{selectedCard.creatorName || 'Noma\'lum'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-outline font-semibold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Yaratilgan vaqt</span>
                    <p className="font-semibold font-mono text-on-surface text-[11px]">{selectedCard.createdAt || '-'}</p>
                  </div>
                  {selectedCard.updatedAt && (
                    <div className="space-y-1 col-span-2 border-t border-outline-variant/20 pt-2 mt-1">
                      <span className="text-[10px] text-outline font-semibold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> O'zgartirilgan vaqt</span>
                      <p className="font-semibold font-mono text-on-surface text-[11px]">{selectedCard.updatedAt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full bg-primary text-white py-3 rounded-xl font-label-md hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm"
            >
              Yopish
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL 3: MUVAFFAQIYATLI BLOKLANDI */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Muvaffaqiyatli!"
        maxWidth="max-w-md"
      >
        <div className="text-center py-4 font-body-md">
          <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
          </div>
          <h3 className="text-headline-sm text-center mb-2 font-bold text-primary">Bloklandi!</h3>
          <p className="text-body-md text-on-surface-variant text-center mb-8 px-4 font-medium">
            Karta drop kartalar reyestriga muvaffaqiyatli kiritildi va tizimdagi barcha tranzaksiyalar to'xtatildi.
          </p>
          <button
            onClick={() => setIsSuccessModalOpen(false)}
            className="w-full bg-primary text-white py-3 rounded-xl font-label-md hover:bg-primary-container transition-all shadow-sm active:scale-95"
          >
            Tushunarli
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DropCards;
