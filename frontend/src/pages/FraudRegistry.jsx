import React, { useState, useEffect } from 'react';
import { apiService, formatDate } from "../services/api";
import ExcelExport from '../components/ExcelExport';
import Modal from '../components/Modal';
import {
  Search,
  Plus,
  Calendar,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  CheckCircle,
  Trash2,
  Paperclip,
  Edit3,
  X
} from 'lucide-react';

const FraudRegistry = () => {
  const [loading, setLoading] = useState(true);
  const [frauds, setFrauds] = useState([]);
  const [filteredFrauds, setFilteredFrauds] = useState([]);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [selectedFraud, setSelectedFraud] = useState(null);
  const [editingFraud, setEditingFraud] = useState(null);

  // Form Fields State (Used for both Create and Edit)
  const [formType, setFormType] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVictim, setFormVictim] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDamage, setFormDamage] = useState('');
  const [formMeasures, setFormMeasures] = useState('');
  const [formComments, setFormComments] = useState('');

  // File attachments state for Create/Edit
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);

  // Active user info for Admin controls
  const storedUser = localStorage.getItem('active_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = currentUser && currentUser.role === 'Admin';

  const formatUZS = (amount) => {
    return `${Number(amount).toLocaleString('uz-UZ')} UZS`;
  };

  // Helper for dev/prod environment file path
  const getFileUrl = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    if (window.location.port === '5173') {
      return `http://localhost:3001${filePath}`;
    }
    return filePath;
  };

  // Load fraud list
  const fetchFrauds = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFrauds();
      setFrauds(data);
      setFilteredFrauds(data);
      setLoading(false);
    } catch (err) {
      console.error("Firibgarlik holatlarini yuklashda xato:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrauds();
  }, []);

  // Filter logic
  const handleFilter = () => {
    let temp = [...frauds];

    // Search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      temp = temp.filter(f =>
        f.victimName.toLowerCase().includes(term) ||
        f.fraudType.toLowerCase().includes(term) ||
        f.description.toLowerCase().includes(term) ||
        f.comments.toLowerCase().includes(term)
      );
    }

    // Date range
    if (startDate !== '') {
      temp = temp.filter(f => new Date(f.fraudDate) >= new Date(startDate));
    }
    if (endDate !== '') {
      temp = temp.filter(f => new Date(f.fraudDate) <= new Date(endDate));
    }

    setFilteredFrauds(temp);
  };

  useEffect(() => {
    handleFilter();
  }, [searchTerm, startDate, endDate, frauds]);

  // Handle file selections (appends and deduplicates)
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => {
        const filtered = newFiles.filter(nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size));
        return [...prev, ...filtered];
      });
    }
  };

  // Remove a newly selected file from the upload list
  const handleRemoveSelectedFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Open Add modal and clear inputs
  const openAddModal = () => {
    setFormType('');
    setFormDesc('');
    setFormVictim('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDamage('');
    setFormMeasures('');
    setFormComments('');
    setSelectedFiles([]);
    setIsAddModalOpen(true);
  };

  // Form Submit (Create Case)
  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('fraud_type', formType);
    formData.append('description', formDesc);
    formData.append('victim_name', formVictim);
    formData.append('fraud_date', formDate);
    formData.append('damage_amount', Number(formDamage) || 0);
    formData.append('measures_taken', formMeasures);
    formData.append('comments', formComments);

    // Append multiple files
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await apiService.createFraud(formData);
      setIsAddModalOpen(false);
      setSelectedFiles([]);
      setIsSuccessModalOpen(true);
      await fetchFrauds();
    } catch (err) {
      alert("Xatolik yuz berdi: " + err.message);
    }
  };

  // Open Details Modal
  const openDetail = (fraud) => {
    setSelectedFraud(fraud);
    setIsDetailModalOpen(true);
  };

  // Open Edit Modal and prefill inputs
  const openEditModal = (fraud) => {
    setEditingFraud(fraud);
    setFormType(fraud.fraudType);
    setFormDesc(fraud.description);
    setFormVictim(fraud.victimName);
    setFormDate(fraud.fraudDate);
    setFormDamage(fraud.damageAmount);
    setFormMeasures(fraud.measuresTaken || '');
    setFormComments(fraud.comments || '');
    setExistingAttachments(fraud.attachments || []);
    setDeletedFileIds([]);
    setSelectedFiles([]);

    // Close detail modal if open
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  // Mark an existing attachment for deletion
  const handleMarkAttachmentDelete = (fileId) => {
    setDeletedFileIds([...deletedFileIds, fileId]);
    setExistingAttachments(existingAttachments.filter(a => a.id !== fileId));
  };

  // Form Submit (Save Edits)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingFraud) return;

    const formData = new FormData();
    formData.append('fraud_type', formType);
    formData.append('description', formDesc);
    formData.append('victim_name', formVictim);
    formData.append('fraud_date', formDate);
    formData.append('damage_amount', Number(formDamage) || 0);
    formData.append('measures_taken', formMeasures);
    formData.append('comments', formComments);

    // Send list of attachment IDs to delete
    formData.append('deleted_file_ids', JSON.stringify(deletedFileIds));

    // Append newly uploaded files
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      await apiService.updateFraud(editingFraud.id, formData);
      setIsEditModalOpen(false);
      setEditingFraud(null);
      setSelectedFiles([]);
      setDeletedFileIds([]);

      setIsSuccessModalOpen(true);
      await fetchFrauds();
    } catch (err) {
      alert("Yangilashda xatolik yuz berdi: " + err.message);
    }
  };

  // Delete case
  const handleDelete = async (fraudId) => {
    if (!window.confirm("Ushbu firibgarlik holatini butunlay o'chirib tashlamoqchimisiz? Undagi barcha fayllar ham serverdan o'chiriladi.")) {
      return;
    }
    try {
      await apiService.deleteFraud(fraudId);
      setIsDetailModalOpen(false);
      setIsEditModalOpen(false);
      await fetchFrauds();
    } catch (err) {
      alert("O'chirishda xatolik yuz berdi: " + err.message);
    }
  };

  // Stats calculations
  const totalDamage = filteredFrauds.reduce((sum, f) => sum + f.damageAmount, 0);
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthFrauds = filteredFrauds.filter(f => f.fraudDate && f.fraudDate.startsWith(currentMonthPrefix));
  const currentMonthCount = currentMonthFrauds.length;
  const currentMonthDamage = currentMonthFrauds.reduce((sum, f) => sum + f.damageAmount, 0);

  const excelHeaders = [
    { label: 'Turi', key: 'fraudType' },
    { label: 'Jabrlanuvchi F.I.O', key: 'victimName' },
    { label: 'Qisqacha tasnifi', key: 'description' },
    { label: 'Aniqlangan sana', key: 'fraudDate' },
    { label: 'Yetkazilgan zarar', key: 'damageAmount', format: (val) => formatUZS(val) },
    { label: 'Ko\'rilgan choralar', key: 'measuresTaken' },
    { label: 'Qo\'shimcha izoh', key: 'comments' },
    { label: 'Kiritgan xodim', key: 'creatorName' },
    { label: 'Yaratilgan vaqt', key: 'createdAt' },
    { label: 'Oxirgi tahrirlovchi', key: 'updaterName' },
    { label: 'Oxirgi tahrirlangan vaqt', key: 'updatedAt' }
  ];

  return (
    <div className="space-y-stack-lg animate-slide-up font-body-md">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg font-bold text-primary">Fraud reyestri</h1>
        </div>
        <div className="flex gap-3">
          <ExcelExport
            data={filteredFrauds}
            headers={excelHeaders}
            filename="Fraud_Reyestri"
          />
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Yangi qo'shish</span>
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Card 1: Jami holatlar */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-primary-container/10 rounded-lg text-primary">
              <AlertTriangle className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full select-none">Jami</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Jami ro'yxatga olingan</h3>
            <p className="text-2xl font-extrabold text-primary">{filteredFrauds.length} ta</p>
          </div>
        </div>

        {/* Card 2: Joriy oyda ro'yxatga olingan */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full select-none">Joriy oy</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Joriy oyda ro'yxatga olingan</h3>
            <p className="text-2xl font-extrabold text-primary">{currentMonthCount} ta</p>
          </div>
        </div>

        {/* Card 3: Jami zarar */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full select-none">Zarar</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Umumiy zarar summasi</h3>
            <p className="text-xl font-extrabold text-primary">{formatUZS(totalDamage)}</p>
          </div>
        </div>

        {/* Card 4: Joriy oydagi zarar */}
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm card-hover-effect flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full select-none">Joriy oy zarari</span>
          </div>
          <div>
            <h3 className="text-on-surface-variant text-xs font-semibold mb-1 uppercase tracking-wider">Joriy oydagi zarar</h3>
            <p className="text-xl font-extrabold text-primary">{formatUZS(currentMonthDamage)}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-6 rounded-xl border border-outline-variant shadow-sm flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[280px] space-y-1.5">
          <label className="font-label-md text-on-surface-variant flex items-center gap-1.5">
            <Search className="w-4 h-4 text-outline" /> Qidiruv
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Jabrlanuvchi, tur, tavsif yoki izoh..."
            className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* Date Filters */}
        <div className="w-80 space-y-1.5">
          <label className="font-label-md text-on-surface-variant flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-outline" /> Sana oralig'i
          </label>
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
      </div>

      {/* Grid List / Table */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <svg className="animate-spin h-8 w-8 text-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-outline font-medium">Firibgarlik holatlari yuklanmoqda...</span>
            </div>
          ) : filteredFrauds.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant font-medium text-sm">
              <AlertTriangle className="w-12 h-12 text-outline-variant mx-auto mb-4" />
              Yozuvlar topilmadi! Qidiruv shartlarini o'zgartirib ko'ring.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-[11px] uppercase text-on-surface-variant font-bold border-b border-outline-variant">
                  <th className="px-6 py-4 whitespace-nowrap">Turi va Tasnifi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Jabrlanuvchi F.I.O</th>
                  <th className="px-6 py-4 whitespace-nowrap">Zarar Summasi</th>
                  <th className="px-6 py-4 whitespace-nowrap">Aniqlangan Sana</th>
                  <th className="px-6 py-4 whitespace-nowrap">Ilovalar</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredFrauds.map((fraud) => (
                  <tr key={fraud.id} className="hover:bg-surface-container-low/30 transition-colors zebra-row font-body-md">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary">{fraud.fraudType}</p>
                      <p className="text-xs text-outline line-clamp-1 max-w-xs">{fraud.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-on-surface">
                      {fraud.victimName}
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface whitespace-nowrap">
                      {formatUZS(fraud.damageAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-on-surface font-semibold">
                      {formatDate(fraud.fraudDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {fraud.attachments && fraud.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary-container/10 px-2 py-0.5 rounded-full font-semibold border border-primary-container/20">
                          <Paperclip className="w-3.5 h-3.5" />
                          {fraud.attachments.length} ta fayl
                        </span>
                      ) : (
                        <span className="text-xs text-outline-variant">Fayl yo'q</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openDetail(fraud)}
                          className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-all duration-200 active:scale-90"
                          title="Tafsilotlarni ko'rish"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(fraud)}
                          className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-all duration-200 active:scale-90"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL 1: YANGI FRAUD HO'LATINI QO'SHISH */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedFiles([]);
        }}
        title="Yangi firibgarlik holatini kiritish"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firibgarlik turi */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Firibgarlik turi (Turi)</label>
              <input
                type="text"
                required
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder="Masalan: Karta fishingi, P2P firibgarlik"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Jabrlanuvchi F.I.O */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Jabrlanuvchi F.I.O</label>
              <input
                type="text"
                required
                value={formVictim}
                onChange={(e) => setFormVictim(e.target.value)}
                placeholder="Jabrlanuvchining to'liq ismi"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Qisqacha tasnifi */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Holatning qisqacha tasnifi</label>
              <input
                type="text"
                required
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Holat qanday sodir bo'lgani haqida qisqacha ma'lumot"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Aniqlangan sana */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Aniqlangan sana</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Yetkazilgan zarar */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Yetkazilgan zarar summasi (UZS)</label>
              <input
                type="number"
                value={formDamage}
                onChange={(e) => setFormDamage(e.target.value)}
                placeholder="Zarar miqdori"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md font-mono"
              />
            </div>

            {/* Ko'rilgan choralar */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Ko'rilgan choralar</label>
              <textarea
                value={formMeasures}
                onChange={(e) => setFormMeasures(e.target.value)}
                rows={3}
                placeholder="Ushbu holat yuzasidan amalga oshirilgan tezkor harakatlar..."
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              ></textarea>
            </div>

            {/* Izoh */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Qo'shimcha izoh</label>
              <input
                type="text"
                value={formComments}
                onChange={(e) => setFormComments(e.target.value)}
                placeholder="Tegishli xavfsizlik guruhi yoki operativ xodim izohi"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Fayllarni yuklash */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Fayllarni biriktirish (Bir nechta fayl mumkin)</label>
              <div className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-surface-container-low/20">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Paperclip className="w-8 h-8 text-outline mx-auto mb-2" />
                <span className="block text-sm font-semibold text-primary">Kompyuterdan fayllarni tanlash</span>
                <span className="block text-xs text-outline mt-1">Shtamp va skrinshotlar, arizalar yoki dalillar (PDF, PNG, JPG...)</span>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold text-on-surface-variant">Tanlangan fayllar ({selectedFiles.length} ta):</p>
                  <ul className="divide-y divide-outline-variant/30 border border-outline-variant rounded-lg bg-surface-container-low/30 overflow-hidden">
                    {selectedFiles.map((f, i) => (
                      <li key={i} className="px-3 py-2 text-xs flex justify-between items-center text-on-surface-variant font-medium font-mono">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={f.name}>{f.name}</span>
                          <span className="text-[10px] text-outline flex-shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(i)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                          title="Faylni o'chirish"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setSelectedFiles([]);
              }}
              className="px-5 py-2.5 rounded-lg border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-low active:scale-95 transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TAHRIRLASH OYNASI */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFraud(null);
          setSelectedFiles([]);
          setDeletedFileIds([]);
        }}
        title="Firibgarlik holatini tahrirlash"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firibgarlik turi */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Firibgarlik turi (Turi)</label>
              <input
                type="text"
                required
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder="Masalan: Karta fishingi, P2P firibgarlik"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Jabrlanuvchi F.I.O */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Jabrlanuvchi F.I.O</label>
              <input
                type="text"
                required
                value={formVictim}
                onChange={(e) => setFormVictim(e.target.value)}
                placeholder="Jabrlanuvchining to'liq ismi"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Qisqacha tasnifi */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Holatning qisqacha tasnifi</label>
              <input
                type="text"
                required
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Holat qanday sodir bo'lgani haqida qisqacha ma'lumot"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Aniqlangan sana */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Aniqlangan sana</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Yetkazilgan zarar */}
            <div className="space-y-1.5 col-span-1">
              <label className="block font-label-md text-label-md text-on-surface-variant">Yetkazilgan zarar summasi (UZS)</label>
              <input
                type="number"
                value={formDamage}
                onChange={(e) => setFormDamage(e.target.value)}
                placeholder="Zarar miqdori"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md font-mono"
              />
            </div>

            {/* Ko'rilgan choralar */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Ko'rilgan choralar</label>
              <textarea
                value={formMeasures}
                onChange={(e) => setFormMeasures(e.target.value)}
                rows={3}
                placeholder="Ushbu holat yuzasidan amalga oshirilgan tezkor harakatlar..."
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              ></textarea>
            </div>

            {/* Izoh */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Qo'shimcha izoh</label>
              <input
                type="text"
                value={formComments}
                onChange={(e) => setFormComments(e.target.value)}
                placeholder="Tegishli xavfsizlik guruhi yoki operativ xodim izohi"
                className="w-full px-4 py-3 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md"
              />
            </div>

            {/* Mavjud biriktirilgan fayllar */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Mavjud biriktirilgan fayllar</label>
              {existingAttachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {existingAttachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant rounded-xl"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-on-surface truncate font-mono max-w-[150px]" title={file.originalName}>
                          {file.originalName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMarkAttachmentDelete(file.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                        title="Faylni o'chirish"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline-variant italic">Mavjud fayllar yo'q (yoki hammasi o'chirildi)</p>
              )}
            </div>

            {/* Yangi fayllarni biriktirish */}
            <div className="space-y-1.5 col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant">Yangi fayllar qo'shish (Fayllarni ilova qilish)</label>
              <div className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-6 text-center cursor-pointer relative bg-surface-container-low/20">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Paperclip className="w-8 h-8 text-outline mx-auto mb-2" />
                <span className="block text-sm font-semibold text-primary">Yangi fayllarni tanlash</span>
                <span className="block text-xs text-outline mt-1">Avvalgi fayllarga qo'shimcha sifatida yuklanadi</span>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-bold text-on-surface-variant">Yangi tanlangan fayllar ({selectedFiles.length} ta):</p>
                  <ul className="divide-y divide-outline-variant/30 border border-outline-variant rounded-lg bg-surface-container-low/30 overflow-hidden">
                    {selectedFiles.map((f, i) => (
                      <li key={i} className="px-3 py-2 text-xs flex justify-between items-center text-on-surface-variant font-medium font-mono">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={f.name}>{f.name}</span>
                          <span className="text-[10px] text-outline flex-shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(i)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                          title="Faylni o'chirish"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingFraud(null);
                setSelectedFiles([]);
                setDeletedFileIds([]);
              }}
              className="px-5 py-2.5 rounded-lg border border-outline text-on-surface font-label-md text-label-md hover:bg-surface-container-low active:scale-95 transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              O'zgarishlarni saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: TAFSILOTLARNI KO'RISH OYNASI */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Firibgarlik holati tafsilotlari"
        maxWidth="max-w-3xl"
      >
        {selectedFraud && (
          <div className="space-y-6">
            {/* Top brief */}
            <div className="bg-surface-container-low/50 border border-outline-variant rounded-xl p-5 flex justify-between items-center flex-wrap gap-4">
              <div>
                <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{selectedFraud.fraudType}</span>
                <h2 className="text-xl font-bold text-on-surface mt-1">{selectedFraud.victimName}</h2>
                <p className="text-xs text-outline mt-1 font-mono">Holat ID: #{selectedFraud.id}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-outline-variant font-bold uppercase">Zarar Miqdori</span>
                <span className="text-lg font-extrabold text-rose-600">{formatUZS(selectedFraud.damageAmount)}</span>
              </div>
            </div>

            {/* General Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-body-md text-on-surface">
              <div className="space-y-1">
                <span className="block text-xs font-bold text-outline uppercase">Qisqacha Tasnif:</span>
                <p className="font-medium bg-surface-container-low/20 px-3 py-2 rounded-lg border border-outline-variant/30">{selectedFraud.description}</p>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-bold text-outline uppercase">Aniqlangan Sana:</span>
                <p className="font-medium bg-surface-container-low/20 px-3 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-primary" /> {formatDate(selectedFraud.fraudDate)}
                </p>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="block text-xs font-bold text-outline uppercase">Ko'rilgan Choralar:</span>
                <p className="font-medium bg-surface-container-low/20 px-3 py-2.5 rounded-lg border border-outline-variant/30 min-h-[80px] whitespace-pre-wrap">
                  {selectedFraud.measuresTaken || "Choralar ko'rilmagan"}
                </p>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="block text-xs font-bold text-outline uppercase">Xodim Izohi:</span>
                <p className="font-medium bg-surface-container-low/20 px-3 py-2 rounded-lg border border-outline-variant/30 italic text-on-surface-variant">
                  {selectedFraud.comments ? `"${selectedFraud.comments}"` : "Izoh yozilmagan"}
                </p>
              </div>

              {/* Log details */}
              <div className="text-xs text-outline space-y-1 bg-surface-container-low/30 p-3 rounded-lg border border-outline-variant/40 col-span-2">
                <p>Kiritgan xodim: <span className="font-bold text-on-surface-variant">{selectedFraud.creatorName || 'Operator'}</span> ({formatDate(selectedFraud.createdAt)})</p>
                {selectedFraud.updatedAt && (
                  <p>Oxirgi tahrirlovchi: <span className="font-bold text-on-surface-variant">{selectedFraud.updaterName || 'Admin'}</span> ({formatDate(selectedFraud.updatedAt)})</p>
                )}
              </div>
            </div>

            {/* Attached Files List Section */}
            <div className="space-y-2 pt-4 border-t border-outline-variant">
              <span className="block text-xs font-bold text-outline uppercase">Biriktirilgan Fayllar ({selectedFraud.attachments?.length || 0}):</span>
              {selectedFraud.attachments && selectedFraud.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedFraud.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-primary-container/10 rounded-lg text-primary flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-on-surface truncate font-mono" title={file.originalName}>
                            {file.originalName}
                          </p>
                          <p className="text-[9px] text-outline">Fayl hujjati</p>
                        </div>
                      </div>
                      <a
                        href={getFileUrl(file.filePath)}
                        download={file.originalName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-90"
                        title="Yuklab olish / Ko'rish"
                      >
                        <Download className="w-4.5 h-4.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-outline-variant italic">Ushbu holat yuzasidan hech qanday fayl ilova qilinmagan.</p>
              )}
            </div>

            {/* Footer Admin/Operator controls */}
            <div className="flex justify-between items-center pt-6 border-t border-outline-variant">
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(selectedFraud)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-amber-200 text-amber-700 bg-amber-50/50 rounded-lg text-xs font-bold hover:bg-amber-50 active:scale-95 transition-all shadow-sm"
                >
                  <Edit3 className="w-4.5 h-4.5" />
                  <span>Tahrirlash</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(selectedFraud.id)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 active:scale-95 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                    <span>Holatni o'chirish</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-lg text-on-surface font-label-md text-label-md active:scale-95 transition-all"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* SUCCESS POPUP OVERLAY */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Muvaffaqiyatli saqlandi!"
        maxWidth="max-w-md"
      >
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm select-none">
            <CheckCircle className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-on-surface">Muvaffaqiyatli saqlandi</h4>
            <p className="text-xs text-outline mt-1">Kiritilgan barcha o'zgarishlar va yuklangan fayllar bazada saqlandi.</p>
          </div>
          <button
            onClick={() => setIsSuccessModalOpen(false)}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-label-md text-label-md hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
          >
            Tushunarli
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default FraudRegistry;
