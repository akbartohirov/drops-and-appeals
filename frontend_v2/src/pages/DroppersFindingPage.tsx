import React, { useState, useMemo } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { DataTable, ColumnDef } from '../components/common/DataTable';
import { DwhDropperProfile, DwhTransactionNode } from '../types/antifraud';
import { formatUzs, computeDropperRiskScore } from '../utils/rules';
import { MOCK_NETWORK_NODES } from '../data/mockData';
import { 
  Network, 
  Database, 
  RefreshCw, 
  Search, 
  Filter, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  Lock,
  ExternalLink
} from 'lucide-react';

export const DroppersFindingPage: React.FC = () => {
  const { dwhDroppers, isSyncingDwh, triggerDwhSync, addDropCard, setCurrentPage } = useAntifraud();

  // Behavioral filters
  const [maxHoldingTime, setMaxHoldingTime] = useState<number>(180);
  const [minVelocity, setMinVelocity] = useState<number>(2.0);
  const [riskStatusFilter, setRiskStatusFilter] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<DwhTransactionNode>(MOCK_NETWORK_NODES[2]);
  const [escalatedToast, setEscalatedToast] = useState<string | null>(null);

  // Filtered DWH profiles
  const filteredProfiles = useMemo(() => {
    return dwhDroppers.filter((profile) => {
      if (profile.holdingTimeSeconds > maxHoldingTime) return false;
      if (profile.velocityPerMinute < minVelocity) return false;
      if (riskStatusFilter !== 'all' && profile.riskStatus !== riskStatusFilter) return false;
      return true;
    });
  }, [dwhDroppers, maxHoldingTime, minVelocity, riskStatusFilter]);

  const handleEscalateToDropList = (profile: DwhDropperProfile) => {
    // Add to drop card registry immediately
    addDropCard({
      cardNumber: `9860 3501 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      maskedCardNumber: `9860 35** **** ${Math.floor(1000 + Math.random() * 9000)}`,
      cardHolder: profile.fullName,
      holderPinfl: profile.pinfl,
      bankName: profile.bankName,
      cardSystem: 'Humo',
      blockedDate: new Date().toISOString().split('T')[0],
      totalTurnover: profile.totalInflowUzs,
      transactionCount: Math.round(profile.velocityPerMinute * 40),
      dropPatternType: profile.holdingTimeSeconds < 60 ? 'Tezkor kesh-in / kesh-aut (<90 soniya)' : 'Tranzit tranzaksiya (Pilesos)',
      riskScore: computeDropperRiskScore({
        holdingTimeSeconds: profile.holdingTimeSeconds,
        inOutRatio: profile.inOutRatio,
        velocityPerMinute: profile.velocityPerMinute,
        associatedCardsCount: profile.associatedCardsCount,
      }),
      riskLevel: 'Kritik',
      status: 'Bloklangan',
      isCurrentMonth: true,
      dwhAccount: profile.accountNumber,
      notes: `DWH orqali avtomatik aniqlangan: holding time=${profile.holdingTimeSeconds}s, in/out=${(profile.inOutRatio * 100).toFixed(1)}%.`,
    });

    setEscalatedToast(`${profile.fullName} Drop kartalar reyestriga kiritildi va bloklandi!`);
    setTimeout(() => setEscalatedToast(null), 3000);
  };

  const columns: ColumnDef<DwhDropperProfile>[] = [
    {
      key: 'fullName',
      header: 'Mijoz FISH & PINFL',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-100 text-xs block">{row.fullName}</span>
          <span className="text-[11px] font-mono text-slate-500">JSHSHIR: {row.pinfl}</span>
        </div>
      ),
    },
    {
      key: 'accountNumber',
      header: 'Hisobraqam (20208...)',
      render: (row) => (
        <div>
          <span className="font-mono text-xs text-blue-300 font-semibold block">{row.accountNumber}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.bankName}</span>
        </div>
      ),
    },
    {
      key: 'associatedCardsCount',
      header: 'Kartalar',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
          {row.associatedCardsCount} ta
        </span>
      ),
    },
    {
      key: 'holdingTimeSeconds',
      header: 'Holding Time',
      align: 'right',
      render: (row) => {
        const isCritical = row.holdingTimeSeconds <= 60;
        return (
          <div>
            <span className={`font-mono text-xs font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
              {row.holdingTimeSeconds} soniya
            </span>
            <span className="text-[10px] text-slate-500 block">o'rtacha turish vaqti</span>
          </div>
        );
      },
    },
    {
      key: 'inOutRatio',
      header: 'In/Out Balans',
      align: 'right',
      render: (row) => (
        <div className="font-mono text-xs text-slate-200">
          <span className="font-bold">{(row.inOutRatio * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block">tranzit koeffitsiyenti</span>
        </div>
      ),
    },
    {
      key: 'velocityPerMinute',
      header: 'Tezlik (op/min)',
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900">
          {row.velocityPerMinute} / min
        </span>
      ),
    },
    {
      key: 'totalInflowUzs',
      header: 'DWH Kirish Hajmi',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-200 tabular-nums">
          {formatUzs(row.totalInflowUzs)}
        </span>
      ),
    },
    {
      key: 'riskStatus',
      header: 'DWH Xulosasi',
      render: (row) => {
        let style = 'bg-slate-800 text-slate-300 border-slate-700';
        if (row.riskStatus === 'Tasdiqlangan Dropper') style = 'bg-red-950/80 text-red-300 border-red-800';
        if (row.riskStatus === 'Tergov ostida') style = 'bg-amber-950/80 text-amber-300 border-amber-800';
        if (row.riskStatus === 'Gumonlanuvchi') style = 'bg-blue-950/80 text-blue-300 border-blue-800';
        if (row.riskStatus === 'Bloklangan') style = 'bg-rose-950/80 text-rose-300 border-rose-800';

        return (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${style}`}>
            {row.riskStatus}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Amallar',
      sortable: false,
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEscalateToDropList(row);
          }}
          className="px-2.5 py-1 rounded-md bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 text-xs font-medium transition-colors flex items-center gap-1 mx-auto"
          title="Drop kartalar reyestriga kiritish va bloklash"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Bloklash</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {escalatedToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{escalatedToast}</span>
          </div>
          <button
            onClick={() => setCurrentPage('drop-cards')}
            className="text-white underline font-semibold"
          >
            Reyestrda ko'rish →
          </button>
        </div>
      )}

      {/* Header with DWH Integration Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Dropperlarni Aniqlash (DWH Integratsiyasi)
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              Big Data Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            DWH (Data Warehouse) orqali mijozlar hisobraqamlari xulq-atvori, tezkor tranzit oqimlari va zanjir tahlili
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right text-[11px] text-slate-400">
            <span className="text-emerald-400 font-mono flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              DWH Klasteri Faol
            </span>
            <span className="text-slate-500 font-mono">Sinxron: Har 5 daqiqada</span>
          </div>

          <button
            onClick={triggerDwhSync}
            disabled={isSyncingDwh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-800/80 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isSyncingDwh ? 'animate-spin' : ''}`} />
            <span>{isSyncingDwh ? 'Sinxronlanmoqda...' : 'DWH dan Yangilash'}</span>
          </button>
        </div>
      </div>

      {/* DWH Behavioral Search & Threshold Filter Strip */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span>DWH Qidiruv Va Anomaliya Mezonlari Filtratsiyasi</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Mos kelgan nomzodlar: <strong className="text-purple-300">{filteredProfiles.length}</strong> ta
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          {/* Holding time threshold */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pulning Hisobda Turish Vaqti:</span>
              <span className="font-mono text-amber-400 font-bold">≤ {maxHoldingTime} soniya</span>
            </div>
            <input
              type="range"
              min={30}
              max={600}
              step={15}
              value={maxHoldingTime}
              onChange={(e) => setMaxHoldingTime(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30 sek (Kritik)</span>
              <span>180 sek</span>
              <span>10 min</span>
            </div>
          </div>

          {/* Velocity threshold */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tranzaksiya Tezligi:</span>
              <span className="font-mono text-purple-300 font-bold">≥ {minVelocity} op/min</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={6.0}
              step={0.5}
              value={minVelocity}
              onChange={(e) => setMinVelocity(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0 / min</span>
              <span>3.0 / min</span>
              <span>6.0 / min</span>
            </div>
          </div>

          {/* Risk status dropdown */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between">
            <label className="text-slate-400 block mb-1">DWH Risk Xulosasi:</label>
            <select
              value={riskStatusFilter}
              onChange={(e) => setRiskStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Barchasi (Gumon + Tasdiqlangan)</option>
              <option value="Tasdiqlangan Dropper">Faqat Tasdiqlangan Dropperlar</option>
              <option value="Tergov ostida">Tergov ostida</option>
              <option value="Gumonlanuvchi">Gumonlanuvchilar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Dropper Transaction Network Chain Visualizer */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-400" />
              <span>DWH Tranzaksiya Zanjiri Vizualizatori (Dropper Chain Graph)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pul oqimining jabrlanuvchidan boshlab oraliq tranzit drop kartalar va yakuniy keshoutgacha bo'lgan yo'li
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Tanlangan tugun: <strong className="text-white">{selectedNode.label}</strong>
          </span>
        </div>

        {/* Network Graph Nodes Ribbon */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-3 relative py-3">
            {MOCK_NETWORK_NODES.map((node, idx) => {
              const isSelected = selectedNode.id === node.id;
              let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
              if (node.type === 'victim') badgeColor = 'bg-blue-950 text-blue-300 border-blue-800';
              if (node.type === 'dropper') badgeColor = 'bg-red-950 text-red-300 border-red-800';
              if (node.type === 'transit') badgeColor = 'bg-purple-950 text-purple-300 border-purple-800';
              if (node.type === 'cashout') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';

              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => setSelectedNode(node)}
                    className={`flex-1 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-900/30 ring-1 ring-purple-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                        {node.label}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{node.time}</span>
                    </div>
                    <p className="font-bold text-xs text-slate-100 truncate">{node.name}</p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">{node.bank}</p>
                    <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-200">{formatUzs(node.amount)}</span>
                      <span className="font-mono text-[10px] text-red-400 font-bold">Risk: {node.riskScore}</span>
                    </div>
                  </div>

                  {idx < MOCK_NETWORK_NODES.length - 1 && (
                    <div className="shrink-0 flex items-center justify-center text-slate-600">
                      <ArrowRight className="w-5 h-5 text-purple-400" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Node Detailed Snapshot */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-900/30 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-purple-400 font-semibold block">Tanlangan Tugun Ma'lumotlari:</span>
            <p className="text-slate-200 font-bold text-sm">
              {selectedNode.name} · <span className="font-mono text-slate-400 font-normal">{selectedNode.account}</span>
            </p>
            <p className="text-slate-400 text-xs">
              Bank: {selectedNode.bank} · Tranzaksiya vaqti: {selectedNode.time} · Tranzit miqdori: {formatUzs(selectedNode.amount)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-red-400 px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-800">
              Risk Score: {selectedNode.riskScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Main DWH Dropper Profiles Data Table */}
      <DataTable
        data={filteredProfiles}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="FISH, PINFL, hisobraqam (20208...) yoki bank bo'yicha qidirish..."
        searchField={(item) => `${item.fullName} ${item.pinfl} ${item.accountNumber} ${item.bankName}`}
        pageSizeDefault={10}
        emptyMessage="Filtr bo'yicha DWH hisobraqami yoki mijoz topilmadi"
        exportFileName="dwh_droppers_tahlil.csv"
      />
    </div>
  );
};
