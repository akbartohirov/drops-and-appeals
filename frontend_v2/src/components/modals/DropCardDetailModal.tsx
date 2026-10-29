import React, { useState } from 'react';
import { useAntifraud } from '../../context/AntifraudContext';
import { ModalDialog } from '../common/ModalDialog';
import { formatUzs } from '../../utils/rules';
import { 
  X, 
  CreditCard, 
  ShieldAlert, 
  ShieldCheck, 
  Send, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ExternalLink 
} from 'lucide-react';

export const DropCardDetailModal: React.FC = () => {
  const { inspectingDropCard, setInspectingDropCard, updateDropCardStatus, setCurrentPage } = useAntifraud();
  const [showFullCard, setShowFullCard] = useState(false);

  if (!inspectingDropCard) return null;

  const handleStatusChange = (status: typeof inspectingDropCard.status) => {
    updateDropCardStatus(inspectingDropCard.id, status);
  };

  return (
    <ModalDialog
      isOpen={Boolean(inspectingDropCard)}
      onClose={() => setInspectingDropCard(null)}
      ariaLabel="Drop Karta Dossyesi"
      maxWidthClass="max-w-2xl"
    >
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Drop Karta Dossyesi</h3>
                <span className="font-mono text-xs text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950 border border-red-900">
                  Risk: {inspectingDropCard.riskScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {inspectingDropCard.bankName} · Bloklangan sana: {inspectingDropCard.blockedDate}
              </p>
            </div>
          </div>
          <button
            onClick={() => setInspectingDropCard(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs md:text-sm">
          {/* Card Presentation Box */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 tracking-wider">
                {inspectingDropCard.bankName.toUpperCase()}
              </span>
              <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800 font-mono">
                {inspectingDropCard.cardSystem}
              </span>
            </div>

            <div className="flex items-center justify-between my-2">
              <span className="font-mono text-lg md:text-xl font-bold tracking-widest text-slate-100">
                {showFullCard ? inspectingDropCard.cardNumber : inspectingDropCard.maskedCardNumber}
              </span>
              <button
                onClick={() => setShowFullCard(!showFullCard)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                title={showFullCard ? "Raqamni maskalash" : "To'liq ko'rish (Audit)"}
              >
                {showFullCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Karta egasi (FISH):</span>
                <span className="font-semibold text-slate-200">{inspectingDropCard.cardHolder}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">JSHSHIR (PINFL):</span>
                <span className="font-mono text-slate-300">{inspectingDropCard.holderPinfl}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-500 block">Qoldiq summasi (UZS):</span>
              <span className="font-mono text-sm md:text-base font-bold text-red-400 tabular-nums">
                {formatUzs(inspectingDropCard.balanceAmount || 0)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-500 block">Umumiy aylanma:</span>
              <span className="font-mono text-sm md:text-base font-bold text-slate-200 tabular-nums">
                {formatUzs(inspectingDropCard.totalTurnover)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-500 block">Operatsiyalar soni:</span>
              <span className="font-mono text-sm md:text-base font-bold text-slate-200">
                {inspectingDropCard.transactionCount} ta
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-500 block">Joriy status:</span>
              <span className="font-semibold text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-900 inline-block mt-1">
                {inspectingDropCard.status}
              </span>
            </div>
          </div>

          {/* Audit & Block Details */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Bloklagan shaxs:</span>
                <span className="font-medium text-xs text-slate-200">{inspectingDropCard.blockedBy || 'B. Mirzayev (Bosh tahlilchi)'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Yaratilgan / O'zgartirilgan vaqt:</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {inspectingDropCard.createdAtTime || `${inspectingDropCard.blockedDate} 09:00:00`} · {inspectingDropCard.updatedAtTime || `${inspectingDropCard.blockedDate} 10:30:00`}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300">Izoh / Bloklash sababi:</span>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {inspectingDropCard.blockingReason || inspectingDropCard.notes}
              </p>
            </div>
          </div>

          {/* DWH Info */}
          <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-900/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-purple-400 block font-medium">Bog'langan DWH Hisobraqam:</span>
              <span className="font-mono text-xs text-purple-200 font-semibold">{inspectingDropCard.dwhAccount}</span>
            </div>
            <button
              onClick={() => {
                setInspectingDropCard(null);
                setCurrentPage('droppers-find');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-xs font-medium border border-purple-700/50 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>DWH da tahlil qilish</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange('Vaqtincha cheklangan')}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Vaqtincha cheklash
            </button>
            <button
              onClick={() => handleStatusChange('Bloklangan')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-950/30 hover:bg-red-900/40 text-red-300 text-xs font-medium transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>To'liq bloklash</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange('Sud/IIBga yuborilgan')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>IIB Kiberxavfsizlikka yo'naltirish</span>
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};
