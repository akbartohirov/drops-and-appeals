import React, { useState } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { HumoClearingFile, HumoRuleTrigger } from '../types/antifraud';
import { formatUzs, calculateClearingStats } from '../utils/rules';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Cpu, 
  ShieldAlert, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Download,
  Filter
} from 'lucide-react';

export const HumoClearingPage: React.FC = () => {
  const { humoClearingFiles, processNewClearingFile, isProcessingClearing } = useAntifraud();
  const [selectedFileForRules, setSelectedFileForRules] = useState<HumoClearingFile>(humoClearingFiles[0]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newFileCycle, setNewFileCycle] = useState('HUMO_CLR_20261025_CYCLE04.dat');

  const stats = calculateClearingStats(humoClearingFiles);

  const handleSimulateAnalysis = async () => {
    setUploadModalOpen(false);
    await processNewClearingFile(newFileCycle, 'DAT');
  };

  const columns: ColumnDef<HumoClearingFile>[] = [
    {
      key: 'fileName',
      header: 'Kliring Fayli',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-blue-300 block">
            {row.fileName}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {row.clearingCycle} · {(row.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
      ),
    },
    {
      key: 'fileDate',
      header: 'Sana & Vaqt',
      render: (row) => (
        <div>
          <span className="font-mono text-xs text-slate-300 block">{row.fileDate}</span>
          <span className="text-[10px] font-mono text-slate-500">{row.processedAt.split(' ')[1]}</span>
        </div>
      ),
    },
    {
      key: 'totalTransactions',
      header: 'Tranzaksiyalar',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-slate-200">
          {row.totalTransactions.toLocaleString()} ta
        </span>
      ),
    },
    {
      key: 'totalVolumeUzs',
      header: 'Kliring hajmi',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-slate-200 font-semibold tabular-nums">
          {formatUzs(row.totalVolumeUzs)}
        </span>
      ),
    },
    {
      key: 'flaggedAnomaliesCount',
      header: 'Anomaliyalar',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-1 font-mono text-xs">
          <span className="px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800">
            {row.flaggedAnomaliesCount} ta
          </span>
        </div>
      ),
    },
    {
      key: 'flaggedVolumeUzs',
      header: 'Shubhali summa',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-red-400 tabular-nums">
          {formatUzs(row.flaggedVolumeUzs)}
        </span>
      ),
    },
    {
      key: 'detectedDropCardsCount',
      header: 'Drop kartalar',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-red-400 px-2 py-0.5 rounded bg-red-950/80 border border-red-900">
          {row.detectedDropCardsCount} ta
        </span>
      ),
    },
    {
      key: 'processingStatus',
      header: 'Status',
      render: (row) => (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          {row.processingStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Qoidalar',
      sortable: false,
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedFileForRules(row);
          }}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedFileForRules?.id === row.id
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          Qoidalar tahlili
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Humo Processing Kliring Fayllari Tahlili
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900">
              Settlement Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Banklararo kliring fayllari (.dat / .xml) bo'yicha anomaliyalar, trigger qoidalari va drop-indikatorlar
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={() => setUploadModalOpen(true)}
            disabled={isProcessingClearing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {isProcessingClearing ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-white" />
                <span>Kliring tahlil qilinmoqda...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Yangi Kliring Faylini Tahlilga Yuklash</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-slate-400 block font-medium">Tahlil Qilingan Kliring Hajmi:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {formatUzs(stats.totalVolumeUzs)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Jami {stats.totalFiles} ta sessiya fayli</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-amber-400 block font-medium">Aniqlangan Anomaliyalar:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
              {stats.totalAnomaliesCount} ta
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Qoidalar asosida belgilangan operatsiyalar</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-red-400 block font-medium">Shubhali Aylanma Summasi:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums">
              {formatUzs(stats.totalFlaggedVolumeUzs)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">To'xtatib qolish talab etilgan oqim</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-1">
          <span className="text-xs text-red-400 block font-medium">Aniqlangan Drop Kartalar:</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-300 tabular-nums">
              {stats.totalDetectedDropsCount} ta
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Avtomatik bloklashga yuborilgan</p>
        </div>
      </div>

      {/* Rules Engine Breakdown Panel:
          "Qoidalar bo'yicha ko'rsatkichlari va Drop bo'yicha ko'rsatkichlar" */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>
                Qoidalar Bo'yicha Ko'rsatkichlar & Drop Indikatorlari ({selectedFileForRules.fileName})
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ushbu kliring fayli bo'yicha ishga tushgan antifrod tekshiruv qoidalari
            </p>
          </div>
          <span className="text-xs font-mono text-blue-400 px-2.5 py-1 rounded bg-blue-950 border border-blue-900">
            {selectedFileForRules.clearingCycle}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedFileForRules.rulesTriggered.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-900">
                      {rule.ruleCode}
                    </span>
                    <span className="text-xs font-bold text-slate-100">{rule.ruleName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{rule.description}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                  rule.severity === 'Kritik' ? 'bg-red-950 text-red-300 border border-red-900' : 'bg-amber-950 text-amber-300 border border-amber-900'
                }`}>
                  {rule.severity}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Trigger soni:</span>
                  <span className="font-mono text-slate-200 font-semibold">{rule.triggerCount} marta</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Shubhali summa:</span>
                  <span className="font-mono text-red-400 font-semibold tabular-nums">
                    {formatUzs(rule.flaggedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Drop kartalar:</span>
                  <span className="font-mono text-amber-300 font-semibold">{rule.detectedDropsCount} ta</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main DataTable of Clearing Files */}
      <DataTable
        data={humoClearingFiles}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Fayl nomi, sana yoki kliring sessiyasi bo'yicha..."
        searchField={(item) => `${item.fileName} ${item.clearingCycle} ${item.fileDate}`}
        pageSizeDefault={5}
        emptyMessage="Humo kliring fayli topilmadi"
        onRowClick={(row) => setSelectedFileForRules(row)}
        exportFileName="humo_kliring_fayllari.csv"
      />

      {/* Upload/Simulate Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                <span>Humo Kliring Faylini Yuklash va Tahlil Qilish</span>
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Kliring settlement faylini tanlang yoki serverdan to'g'ridan-to'g'ri yangi tsiklni tahlilga torting:
              </p>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <label className="text-[11px] text-slate-400">Fayl nomi / Sessiya kodi:</label>
                <input
                  type="text"
                  value={newFileCycle}
                  onChange={(e) => setNewFileCycle(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-lg text-blue-300 text-[11px] leading-relaxed">
                Tizim avtomatik ravishda barcha P2P tranzaksiyalarni RULE-104, RULE-208 va RULE-312 qoidalari bo'yicha tekshirib, drop kartalar reyestrini yangilaydi.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSimulateAnalysis}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
              >
                Tahlilni Boshlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
