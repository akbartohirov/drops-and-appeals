import React, { useState } from 'react';
import { useAntifraud } from '../../context/AntifraudContext';
import { ModalDialog } from '../common/ModalDialog';
import { formatUzs } from '../../utils/rules';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  CreditCard, 
  Phone, 
  Clock, 
  FileText,
  ShieldCheck
} from 'lucide-react';

export const AppealDetailModal: React.FC = () => {
  const { inspectingAppeal, setInspectingAppeal, updateAppealStatus } = useAntifraud();
  const [resolutionText, setResolutionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!inspectingAppeal) return null;

  const handleStatusChange = (status: 'Ijobiy hal qilindi' | 'Rad etildi' | 'Kritik xavf' | 'Tekshiruvda') => {
    setIsSubmitting(true);
    updateAppealStatus(inspectingAppeal.id, status, resolutionText || inspectingAppeal.resolutionNote);
    setTimeout(() => {
      setIsSubmitting(false);
      setInspectingAppeal(null);
    }, 300);
  };

  return (
    <ModalDialog
      isOpen={Boolean(inspectingAppeal)}
      onClose={() => setInspectingAppeal(null)}
      ariaLabel="Murojaatni ko'rib chiqish"
      maxWidthClass="max-w-2xl"
    >
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Murojaatni ko'rib chiqish</h3>
                <span className="font-mono text-xs text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950 border border-blue-900">
                  {inspectingAppeal.appealNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sana: {inspectingAppeal.createdAt} · Mas'ul: {inspectingAppeal.assignedOfficer}
              </p>
            </div>
          </div>
          <button
            onClick={() => setInspectingAppeal(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs md:text-sm">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="text-slate-500 font-medium text-xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Murojaatchi ma'lumotlari:</span>
              </div>
              <p className="font-semibold text-slate-200">{inspectingAppeal.applicantName}</p>
              <div className="space-y-1 text-xs text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">{inspectingAppeal.applicantPhone}</span>
                </p>
                <p>
                  Manzil: <span className="text-slate-300">{inspectingAppeal.address || 'Ko\'rsatilmagan'}</span>
                </p>
                <p>
                  Mijoz kodi: <span className="font-mono text-purple-300">{inspectingAppeal.clientCode || 'CIF-000000'}</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="text-slate-500 font-medium text-xs flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Karta va Zarar summasi:</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                  {formatUzs(inspectingAppeal.damageAmount || inspectingAppeal.amount || 0)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {inspectingAppeal.cardSystem}
                </span>
              </div>
              <div className="space-y-1 text-xs text-slate-400 font-mono">
                <p>Karta: {inspectingAppeal.cardNumber}</p>
                <p className="font-sans text-slate-400">Tashkilot: {inspectingAppeal.organization || inspectingAppeal.bankName}</p>
                <p className="font-sans text-slate-500 text-[11px]">Sana: {inspectingAppeal.incidentDate || inspectingAppeal.createdAt}</p>
              </div>
            </div>
          </div>

          {/* Type, Creator and Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block">Yo'nalish:</span>
              <span className="font-medium text-slate-200 block truncate">{inspectingAppeal.direction || inspectingAppeal.appealType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Yaratuvchi:</span>
              <span className="font-mono text-slate-300 block truncate">{inspectingAppeal.creator || inspectingAppeal.assignedOfficer || 'Tizim'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Yaratilgan vaqt:</span>
              <span className="font-mono text-slate-400 block text-[11px]">{inspectingAppeal.createdAtTime || `${inspectingAppeal.incidentDate} 09:00:00`}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Arizachi bayonoti:</label>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 text-xs text-slate-300 leading-relaxed">
              {inspectingAppeal.description}
            </div>
          </div>

          {/* Resolution Note if any */}
          {inspectingAppeal.resolutionNote && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-400">Qabul qilingan xulosa:</label>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300">
                {inspectingAppeal.resolutionNote}
              </div>
            </div>
          )}

          {/* Decision formulation */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300">
              Xulosa / Tahlilchi izohi (Status o'zgartirish uchun):
            </label>
            <textarea
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Masalan: Arizachining daromad manbasi tekshirildi, noqonuniy harakatlar aniqlanmadi yoki IIB kiberxavfsizlikka yo'naltirildi..."
              rows={3}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => handleStatusChange('Tekshiruvda')}
            disabled={isSubmitting}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Tekshiruvga olish
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange('Rad etildi')}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-medium transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rad etish</span>
            </button>

            <button
              onClick={() => handleStatusChange('Kritik xavf')}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 text-xs font-medium transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Kritik Drop deb belgilash</span>
            </button>

            <button
              onClick={() => handleStatusChange('Ijobiy hal qilindi')}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ijobiy hal qilish (Blokdan yechish)</span>
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};
