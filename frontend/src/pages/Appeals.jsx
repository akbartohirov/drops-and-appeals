import React, { useState, useEffect } from 'react';
import { apiService, formatDate } from "../services/api";
import ExcelExport from '../components/ExcelExport';
import Modal from '../components/Modal';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Eye,
  Pencil,
  CheckCircle,
  FileText,
  MapPin,
  Phone,
  Building,
  Activity,
  TrendingDown,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  User,
  Clock
} from 'lucide-react';

const Appeals = () => {
  const [loading, setLoading] = useState(true);
  const [appeals, setAppeals] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Statistics State
  const [stats, setStats] = useState({
    totalAppeals: 0,
    currentMonthAppeals: 0,
    totalLoss: 0,
    currentMonthLoss: 0
  });

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [directionFilter, setDirectionFilter] = useState('Barchasi');
  const [systemFilter, setSystemFilter] = useState('Barchasi');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [editingAppeal, setEditingAppeal] = useState(null);
  const [successMsg, setSuccessMsg] = useState({ title: 'Kiritildi!', desc: 'Yangi murojaat tizimga xavfsiz kiritildi...' });

  const formatUZS = (amount) => {
    return `${amount.toLocaleString('uz-UZ')} UZS`;
  };

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formOrg, setFormOrg] = useState('MB'); // Default to 'MB' dropdown option
  const [formSystem, setFormSystem] = useState('Mobile');
  const [formDirection, setFormDirection] = useState('Karta'); // Default to 'Karta' dropdown option
  const [formCode, setFormCode] = useState('');
  const [formCard, setFormCard] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formLoss, setFormLoss] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formComment, setFormComment] = useState('');

  // Load appeals on mount
  const fetchAppeals = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await apiService.getAppeals({
        page,
        limit,
        search: searchTerm,
        startDate,
        endDate,
        direction: directionFilter,
        system: systemFilter
      });
      setAppeals(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setStats(res.stats);
      setLoading(false);
    } catch (err) {
      console.error("Murojaatlarni yuklashda xato:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchAppeals(1, pageSize);
  }, [searchTerm, startDate, endDate, directionFilter, systemFilter, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchAppeals(newPage, pageSize);
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

  // Mask input for card number
  const handleCardChange = (e) => {
    const formatted = formatCardSpaced(e.target.value);
    setFormCard(formatted);
  };

  // Format Phone mask +998 (XX) XXX-XX-XX
  const formatPhoneMask = (num) => {
    let clean = num.replace(/\D/g, '');
    // If it starts with 998, strip it for easier editing
    if (clean.startsWith('998')) {
      clean = clean.slice(3);
    }

    let formatted = '+998 ';
    if (clean.length > 0) {
      formatted += '(' + clean.substring(0, 2);
    }
    if (clean.length > 2) {
      formatted += ') ' + clean.substring(2, 5);
    }
    if (clean.length > 5) {
      formatted += '-' + clean.substring(5, 7);
    }
    if (clean.length > 7) {
      formatted += '-' + clean.substring(7, 9);
    }

    return clean.length === 0 ? '' : formatted;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneMask(e.target.value);
    setFormPhone(formatted);
  };

  // Execute filtering dynamically
  const handleFilter = () => {
    setCurrentPage(1);
    fetchAppeals(1, pageSize);
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormOrg('MB');
    setFormSystem('Mobile');
    setFormDirection('Karta');
    setFormCode('');
    setFormCard('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormLoss('');
    setFormSubject('');
    setFormComment('');
    setEditingAppeal(null);
  };

  const handleEditClick = (appeal) => {
    setEditingAppeal(appeal);
    setFormName(appeal.clientName || '');
    
    let phoneVal = appeal.phone || '';
    if (phoneVal.startsWith('998') && phoneVal.length === 12) {
      phoneVal = phoneVal.slice(3);
    }
    setFormPhone(formatPhoneMask(phoneVal));
    setFormAddress(appeal.address || '');
    setFormOrg(appeal.organization || 'MB');
    setFormSystem(appeal.system || 'Mobile');
    setFormDirection(appeal.direction || 'Karta');
    setFormCode(appeal.clientCode || '');
    setFormCard(appeal.cardNumber || '');
    setFormDate(appeal.date || new Date().toISOString().split('T')[0]);
    setFormLoss(appeal.lossAmount || '');
    setFormSubject(appeal.subject || '');
    setFormComment(appeal.comment || '');
    setIsAddModalOpen(true);
  };

  // Handle Form Submit (Create or Update Appeal)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeUser = JSON.parse(localStorage.getItem('active_user') || '{}');

    // Prepare raw values
    let rawPhone = formPhone.replace(/\D/g, '');
    if (rawPhone.length === 9) {
      rawPhone = '998' + rawPhone;
    }

    const appealData = {
      clientName: formName,
      phone: rawPhone,
      address: formAddress,
      organization: formOrg,
      system: formSystem,
      subject: formSubject,
      direction: formDirection,
      clientCode: formCode || `CLI-${Math.floor(10000 + Math.random() * 90000)}`,
      cardNumber: formCard.replace(/\s/g, ''),
      date: formDate,
      lossAmount: Number(formLoss) || 0,
      comment: formComment,
      operatorId: activeUser.id || 2
    };

    try {
      if (editingAppeal) {
        // Keep original card number if editing and not provided
        appealData.cardNumber = formCard.replace(/\s/g, '') || editingAppeal.cardNumber || "";
        await apiService.updateAppeal(editingAppeal.id, appealData);
        setSuccessMsg({
          title: "O'zgartirildi!",
          desc: "Murojaat ma'lumotlari muvaffaqiyatli o'zgartirildi va tahlil hisobotlariga qo'shildi."
        });
      } else {
        appealData.cardNumber = "";
        await apiService.createAppeal(appealData);
        setSuccessMsg({
          title: "Kiritildi!",
          desc: "Yangi murojaat tizimga xavfsiz kiritildi va tahlil hisobotlariga avtomatik ravishda qo'shildi."
        });
      }
      setIsAddModalOpen(false);

      // Reset form fields
      resetForm();

      // Show success modal overlay
      setIsSuccessModalOpen(true);

      // Reload appeals database
      await fetchAppeals(currentPage, pageSize);

    } catch (err) {
      alert("Murojaatni saqlashda xatolik: " + err.message);
    }
  };

  // Open Appeal details modal
  const openDetail = (appeal) => {
    setSelectedAppeal(appeal);
    setIsDetailModalOpen(true);
  };

  // Header definition for Excel Export matching the schema
  const excelHeaders = [
    { label: 'Murojaatchi F.I.O', key: 'clientName' },
    { label: 'Manzil', key: 'address' },
    { label: 'Telefon', key: 'phone', format: (val) => `+${val}` },
    { label: 'Tashkilot', key: 'organization' },
    { label: 'Tizim', key: 'system' },
    { label: 'Yo\'nalish', key: 'direction' },
    { label: 'Mijoz kodi', key: 'clientCode' },
    { label: 'Karta raqami', key: 'cardNumber', format: (val) => formatCardSpaced(val) },
    { label: 'Sana', key: 'date' },
    { label: 'Predmet', key: 'subject' },
    { label: 'Zarar summasi', key: 'lossAmount', format: (val) => Number(val).toLocaleString('uz-UZ') + ' UZS' },
    { label: 'Izoh', key: 'comment' },
    { label: 'Yaratuvchi', key: 'creatorName' },
    { label: 'Yaratilgan vaqt', key: 'createdAt', format: (val) => formatDate(val) },
    { label: 'O\'zgartirilgan vaqt', key: 'updatedAt', format: (val) => formatDate(val) }
  ];

  return (
    <div className="space-y-stack-lg animate-slide-up">
      {/* Top action header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg font-bold text-primary">Murojaatlar reyestri</h1>
        </div>
        <div className="flex gap-3">
          <ExcelExport
            data={async () => {
              const res = await apiService.getAppeals({
                limit: 'all',
                search: searchTerm,
                startDate,
                endDate,
                direction: directionFilter,
                system: systemFilter
              });
              return res.data;
            }}
            headers={excelHeaders}
            filename="Murojaatlar_Reyestri"
          />
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Yangi qo'shish</span>
          </button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Card 1: Barcha murojaatlar soni */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-primary-container/10 rounded-lg text-primary">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full select-none">
              Jami
            </span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Barcha murojaatlar</h3>
            <p className="text-2xl font-extrabold text-primary">{stats.totalAppeals} ta</p>
          </div>
        </div>

        {/* Card 2: Joriy oydagi murojaatlar soni */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Activity className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full select-none">
              Joriy oy
            </span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Joriy oydagi murojaatlar</h3>
            <p className="text-2xl font-extrabold text-primary">{stats.currentMonthAppeals} ta</p>
          </div>
        </div>

        {/* Card 3: Umumiy zarar summasi */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full select-none">
              Jami zarar
            </span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Umumiy zarar summasi</h3>
            <p className="text-2xl font-extrabold text-primary">{formatUZS(stats.totalLoss)}</p>
          </div>
        </div>

        {/* Card 4: Joriy oy zarar summasi */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <CreditCard className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full select-none">
              Joriy oy zarari
            </span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Joriy oy zarar summasi</h3>
            <p className="text-2xl font-extrabold text-primary">{formatUZS(stats.currentMonthLoss)}</p>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar (Glassmorphic) */}
      <div className="glass-panel p-6 rounded-xl border border-outline-variant shadow-sm flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[280px] space-y-1.5">
          <label className="font-label-md text-on-surface-variant flex items-center gap-1.5"><Search className="w-4 h-4 text-outline" /> Qidiruv</label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ism, mijoz kodi yoki karta raqami..."
              className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Date Selectors */}
        <div className="w-80 space-y-1.5">
          <label className="font-label-md text-on-surface-variant flex items-center gap-1.5"><Calendar className="w-4 h-4 text-outline" /> Sana oralig'i</label>
          <div className="flex items-center bg-white border border-outline-variant rounded-lg px-3 py-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-none p-0 text-xs w-full min-w-0 focus:ring-0 cursor-pointer"
            />
            <span className="mx-2 text-outline-variant">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-none p-0 text-xs w-full min-w-0 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Direction dropdown */}
        <div className="w-48 space-y-1.5">
          <label className="font-label-md text-on-surface-variant">Yo'nalish</label>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-primary focus:border-primary"
          >
            <option value="Barchasi">Barchasi</option>
            <option value="Kreditlash">Kreditlash</option>
            <option value="Transaksiyalar">Transaksiyalar</option>
            <option value="Inkasatsiya">Inkasatsiya</option>
            <option value="Omonatlar">Omonatlar</option>
          </select>
        </div>

        {/* System dropdown */}
        <div className="w-48 space-y-1.5">
          <label className="font-label-md text-on-surface-variant">Tizim</label>
          <select
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-primary focus:border-primary"
          >
            <option value="Barchasi">Barchasi</option>
            <option value="Mobile">Mobile App</option>
            <option value="Web">Web Banking</option>
            <option value="ATM">ATM</option>
          </select>
        </div>

        {/* Filter Apply button */}
        <button
          onClick={handleFilter}
          className="bg-primary text-white font-label-md px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-sm"
        >
          <Filter className="w-4 h-4" />
          <span>Filtrlash</span>
        </button>
      </div>

      {/* Main Appeals Database Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <svg className="animate-spin h-8 w-8 text-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-outline font-medium">Murojaatlar ro'yxati yuklanmoqda...</span>
            </div>
          ) : appeals.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant font-medium text-sm">
              <FileText className="w-12 h-12 text-outline-variant mx-auto mb-4" />
              Natija topilmadi! Qidiruv parametrlari yoki filtrlarni o'zgartirib ko'ring.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-[11px] uppercase text-on-surface-variant font-bold">
                  <th className="px-6 py-4 whitespace-nowrap">Murojaatchi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Manzil</th>
                  <th className="px-6 py-4 whitespace-nowrap">Telefon</th>
                  <th className="px-6 py-4 whitespace-nowrap">Tashkilot</th>
                  <th className="px-6 py-4 whitespace-nowrap">Tizim</th>
                  <th className="px-6 py-4 whitespace-nowrap">Yo'nalish</th>
                  <th className="px-6 py-4 whitespace-nowrap">Mijoz kodi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Karta raqami</th>
                  <th className="px-6 py-4 whitespace-nowrap">Sana</th>
                  <th className="px-6 py-4 whitespace-nowrap">Yaratuvchi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Yaratilgan vaqt</th>
                  <th className="px-6 py-4 whitespace-nowrap">O'zgartirilgan vaqt</th>
                  <th className="px-6 py-4 whitespace-nowrap">Zarar summasi</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-body-md">
                {appeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-surface-container-low/30 transition-colors zebra-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-primary">{appeal.clientName}</div>
                      <div className="text-[11px] text-outline">Jismoniy shaxs</div>
                    </td>
                    <td className="px-6 py-4 max-w-[160px] truncate text-on-surface-variant" title={appeal.address}>
                      {appeal.address}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">
                      {appeal.phone ? `+${appeal.phone.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')}` : ''}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant whitespace-nowrap">{appeal.organization}</td>
                    <td className="px-6 py-4 max-w-[160px] truncate text-on-surface-variant" title={appeal.system}>
                      {appeal.system}
                    </td>
                    <td className="px-6 py-4 font-medium text-on-primary-fixed-variant whitespace-nowrap">{appeal.direction}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{appeal.clientCode}</td>
                    <td className="px-6 py-4 font-mono text-xs tracking-tight text-on-surface-variant whitespace-nowrap">
                      {formatCardSpaced(appeal.cardNumber)}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">{formatDate(appeal.date)}</td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap font-semibold text-primary">
                      {appeal.creatorName || 'Noma\'lum'}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono whitespace-nowrap">
                      {formatDate(appeal.createdAt) || '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono whitespace-nowrap">
                      {formatDate(appeal.updatedAt) || '-'}
                    </td>
                    <td className={`px-6 py-4 font-bold whitespace-nowrap ${appeal.lossAmount > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                      {appeal.lossAmount > 0 ? appeal.lossAmount.toLocaleString('uz-UZ') + ' UZS' : '0 UZS'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => openDetail(appeal)}
                        className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all duration-200 active:scale-90"
                        title="Tafsilotlarni ko'rish"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(appeal)}
                        className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-all duration-200 active:scale-90"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
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
                {Math.min(currentPage * pageSize, totalItems)} dan {totalItems} ta murojaat
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

      {/* MODAL 1: YANGI MUROJAAT QO'SHISH */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title={editingAppeal ? "Murojaatni tahrirlash" : "Yangi murojaat yaratish"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Murojaatchi nomi */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Murojaatchi nomi</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Abdullayev Anvar"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 2. Telefon raqami */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Telefon raqami</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={handlePhoneChange}
                placeholder="+998 (90) 123-45-67"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 3. Manzili */}
            <div className="md:col-span-2 space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Manzili</label>
              <input
                type="text"
                required
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Toshkent sh., Yunusobod 14-4"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 4. Tashkilot nomi (Dropdown [MB, Tijorat banklari, Portal, Vazirliklar, Boshqa]) */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Tashkilot nomi</label>
              <select
                required
                value={formOrg}
                onChange={(e) => setFormOrg(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
              >
                <option value="MB">MB</option>
                <option value="Tijorat banklari">Tijorat banklari</option>
                <option value="Portal">Portal</option>
                <option value="Vazirliklar">Vazirliklar</option>
                <option value="Boshqa">Boshqa</option>
              </select>
            </div>

            {/* 5. Tizim */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Tizim</label>
              <input
                type="text"
                required
                value={formSystem}
                onChange={(e) => setFormSystem(e.target.value)}
                placeholder="Tizim nomini kiriting (masalan: Mobile, Web, ATM...)"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 7. Yo'nalish (Dropdown [Karta, Kredit, Depozit, Boshqa]) */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Yo'nalish</label>
              <select
                value={formDirection}
                onChange={(e) => setFormDirection(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
              >
                <option value="Karta">Karta</option>
                <option value="Kredit">Kredit</option>
                <option value="Depozit">Depozit</option>
                <option value="Boshqa">Boshqa</option>
              </select>
            </div>

            {/* 8. Mijoz unikal kodi */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Mijoz unikal kodi</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="00000000"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 9. Sana */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Sana</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 10. Zarar summa */}
            <div className="space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Zarar summasi (UZS)</label>
              <input
                type="number"
                value={formLoss}
                onChange={(e) => setFormLoss(e.target.value)}
                placeholder="0 (agar zarar bo'lmasa bo'sh qoldiring)"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* 6. Predmet */}
            <div className="md:col-span-2 space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Predmet</label>
              <textarea
                required
                rows="2"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="To'lov o'tmaganligi yoki pul yechilganligi haqida..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* 11. Izoh */}
            <div className="md:col-span-2 space-y-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Izoh</label>
              <textarea
                rows="2"
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Qo'shimcha tafsilotlar..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              onClick={() => { setIsAddModalOpen(false); resetForm(); }}
              className="px-6 py-2.5 border border-outline-variant text-primary font-label-md rounded-lg hover:bg-surface-container transition-all active:scale-95"
              type="button"
            >
              Bekor qilish
            </button>
            <button
              className="px-8 py-2.5 bg-primary text-white font-label-md rounded-lg hover:bg-primary-container shadow-md active:scale-95 transition-all"
              type="submit"
            >
              {editingAppeal ? "Yangilash" : "Saqlash"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TAFSILOTLARNI KO'RISH */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Murojaat Tafsilotlari"
        maxWidth="max-w-xl"
      >
        {selectedAppeal && (
          <div className="space-y-6 text-on-surface font-body-md">
            {/* Client Card summary */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant flex items-start gap-4">
              <div className="p-3 bg-primary text-white rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-primary text-lg leading-tight">{selectedAppeal.clientName}</h4>
                <p className="text-xs text-outline font-mono">Mijoz kodi: {selectedAppeal.clientCode}</p>
              </div>
            </div>

            {/* Data grid */}
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-outline-variant/40 py-4">
              <div className="space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon</span>
                <p className="font-semibold font-mono text-on-surface">
                  {selectedAppeal.phone ? `+${selectedAppeal.phone.replace(/(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5')}` : 'Mavjud emas'}
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Karta raqami</span>
                <p className="font-semibold font-mono text-on-surface">{formatCardSpaced(selectedAppeal.cardNumber)}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Tashkilot</span>
                <p className="font-semibold text-on-surface">{selectedAppeal.organization}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Tizim / Yo'nalish</span>
                <p className="font-semibold text-on-surface">{selectedAppeal.system} • {selectedAppeal.direction}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Sana</span>
                <p className="font-semibold text-on-surface">{formatDate(selectedAppeal.date)}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5" /> Zarar summasi</span>
                <p className={`font-bold ${selectedAppeal.lossAmount > 0 ? 'text-error' : 'text-on-surface'}`}>
                  {selectedAppeal.lossAmount > 0 ? selectedAppeal.lossAmount.toLocaleString('uz-UZ') + ' UZS' : '0 UZS'}
                </p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Manzili</span>
                <p className="font-medium text-on-surface">{selectedAppeal.address}</p>
              </div>
              <div className="col-span-2 border-t border-outline-variant/30 pt-4 mt-2">
                <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  Tizim ma'lumotlari
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Yaratuvchi</span>
                    <p className="font-semibold text-on-surface">{selectedAppeal.creatorName || 'Noma\'lum'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Yaratilgan vaqt</span>
                    <p className="font-semibold font-mono text-on-surface">{formatDate(selectedAppeal.createdAt) || "-"}</p>
                  </div>
                  {selectedAppeal.updatedAt && (
                    <div className="space-y-1.5 col-span-2">
                      <span className="text-xs text-outline font-semibold uppercase flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> O'zgartirilgan vaqt</span>
                      <p className="font-semibold font-mono text-on-surface">{formatDate(selectedAppeal.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Predmet & Comment */}
            <div className="space-y-4">
              <div className="space-y-1.5 bg-error-container/10 p-3.5 rounded-lg border border-error-container">
                <span className="text-xs text-error font-bold uppercase tracking-wider">Tekshirish predmeti</span>
                <p className="text-sm font-medium text-on-surface">{selectedAppeal.subject}</p>
              </div>

              {selectedAppeal.comment && (
                <div className="space-y-1.5 bg-surface p-3.5 rounded-lg border border-outline-variant">
                  <span className="text-xs text-outline font-semibold uppercase tracking-wider">Tizim operatori izohi</span>
                  <p className="text-sm text-on-surface-variant italic">"{selectedAppeal.comment}"</p>
                </div>
              )}
            </div>

            {/* Action button */}
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full bg-primary text-white py-3 rounded-xl font-label-md hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Yopish</span>
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL 3: MUVAFFAQIYATLI SAQLANDI OGOHLANTIRISHI */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Muvaffaqiyatli!"
        maxWidth="max-w-md"
      >
        <div className="text-center py-4 font-body-md">
          <div className="w-16 h-16 bg-tertiary-fixed rounded-full flex items-center justify-center mx-auto mb-5 text-on-tertiary-fixed">
            <CheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
          </div>
          <h3 className="text-headline-sm text-center mb-2 font-bold text-primary">{successMsg.title}</h3>
          <p className="text-body-md text-on-surface-variant text-center mb-8 px-4 font-medium">
            {successMsg.desc}
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

export default Appeals;
