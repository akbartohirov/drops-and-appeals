import React from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { 
  formatUzs, 
  calculateDropCardStats, 
  calculateAppealStats, 
  calculateFraudStats, 
  calculateClearingStats 
} from '../utils/rules';
import { 
  MOCK_DAILY_CHART, 
  MOCK_BANK_DISTRIBUTION 
} from '../data/mockData';
import { 
  CreditCard, 
  ShieldAlert, 
  TrendingUp, 
  Inbox, 
  FileSpreadsheet, 
  Network, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Zap,
  Lock,
  FileWarning
} from 'lucide-react';

export const MainDashboardPage: React.FC = () => {
  const { 
    dropCards, 
    appeals, 
    fraudCases, 
    humoClearingFiles, 
    setCurrentPage, 
    setInspectingDropCard, 
    setInspectingAppeal 
  } = useAntifraud();

  const dropStats = calculateDropCardStats(dropCards);
  const appealStats = calculateAppealStats(appeals);
  const fraudStats = calculateFraudStats(fraudCases);
  const clearingStats = calculateClearingStats(humoClearingFiles);

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Antifrod Asosiy Dashboardi
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              Monitoring Aktiv
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Respublika banklararo to'lov tizimlari bo'yicha yagona xavfsizlik va risk intellekti
          </p>
        </div>

        {/* Quick Registry Switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage('drop-cards')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-red-400" />
            <span>Drop kartalar ({dropCards.length})</span>
          </button>
          <button
            onClick={() => setCurrentPage('humo-clearing')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Humo kliring tahlili</span>
          </button>
          <button
            onClick={() => setCurrentPage('droppers-find')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded-lg text-xs font-semibold text-purple-200 transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>DWH Tahlili</span>
          </button>
        </div>
      </div>

      {/* 4 High-Level Key Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Drop cards & monthly turnover */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">Bloklangan Drop Kartalar</span>
            <div className="p-2 rounded-lg bg-red-950/50 border border-red-900/40 text-red-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {dropStats.totalCount}
              </span>
              <span className="text-xs text-red-400 font-mono">
                +{dropStats.currentMonthCount} ta joriy oyda
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Jami aylanma: <span className="text-slate-200 font-semibold">{formatUzs(dropStats.totalTurnover)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Kritik risk darajasida:</span>
            <span className="font-mono text-red-400 font-semibold">{dropStats.criticalRiskCount} ta</span>
          </div>
        </div>

        {/* Metric 2: Blocked Fraud Sum */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">To'xtatib Qolingan Mablag'</span>
            <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-900/40 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatUzs(fraudStats.totalBlocked)}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Umumiy da'vo zarari: <span className="text-slate-200">{formatUzs(fraudStats.totalDamage)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Saqlab qolish darajasi:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {((fraudStats.totalBlocked / (fraudStats.totalDamage || 1)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Metric 3: Humo clearing anomalies */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">Humo Kliring Anomaliyalari</span>
            <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-900/40 text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {clearingStats.totalAnomaliesCount}
              </span>
              <span className="text-xs text-blue-400 font-mono">
                {clearingStats.totalDetectedDropsCount} ta drop
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Shubhali kliring: <span className="text-amber-400">{formatUzs(clearingStats.totalFlaggedVolumeUzs)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Kliring fayllar:</span>
            <span className="font-mono text-slate-200 font-semibold">{clearingStats.totalFiles} ta tahlil qilindi</span>
          </div>
        </div>

        {/* Metric 4: Appeals under review */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">Murojaatlar & E'tirozlar</span>
            <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-900/40 text-amber-400">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white tabular-nums">
                {appealStats.totalCount}
              </span>
              <span className="text-xs text-amber-400 font-mono">
                {appealStats.newCount} ta yangi
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Umumiy summa: <span className="text-slate-200">{formatUzs(appealStats.totalAmount)}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tekshiruvda bo'lgan:</span>
            <span className="font-mono text-blue-400 font-semibold">{appealStats.underReviewCount} ta</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-day threat trend chart (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Kunlik Aniqlangan Drop Kartalar va Zarar Dinamikasi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Oxirgi 7 kun davomida to'xtatilgan drop kartalar va shubhali aylanma hajmi
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500" />
                <span>Drop kartalar soni</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-400" />
                <span>Bloklangan summa (mln UZS)</span>
              </div>
            </div>
          </div>

          {/* Custom responsive SVG / Bar visualization */}
          <div className="pt-4 pb-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-800">
              {MOCK_DAILY_CHART.map((item, idx) => {
                const maxCard = 60;
                const cardHeight = `${(item.blockedCards / maxCard) * 100}%`;
                const amountHeight = `${(item.blockedUzsMln / 600) * 100}%`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.blockedCards} ta / {item.blockedUzsMln} mln
                    </div>
                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      <div
                        style={{ height: cardHeight }}
                        className="w-1/2 max-w-[18px] bg-blue-600 group-hover:bg-blue-500 rounded-t-sm transition-all"
                        title={`${item.date}: ${item.blockedCards} ta drop karta`}
                      />
                      <div
                        style={{ height: amountHeight }}
                        className="w-1/2 max-w-[18px] bg-red-500/80 group-hover:bg-red-400 rounded-t-sm transition-all"
                        title={`${item.date}: ${item.blockedUzsMln} mln so'm`}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-1">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Eng yuqori anomaliya cho'qqisi: <strong className="text-slate-200">25 Oktabr</strong> (56 ta drop karta)
            </span>
            <span className="font-mono text-amber-400">Kripto-P2P keshout to'lqini qayd etildi</span>
          </div>
        </div>

        {/* Right: Bank distribution breakdown (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Banklar Bo'yicha Drop Kartalar</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Ulush %</span>
          </div>

          <p className="text-xs text-slate-400">
            Eng ko'p drop sxemalarida foydalanilgan bank kartalari:
          </p>

          <div className="space-y-3 pt-1">
            {MOCK_BANK_DISTRIBUTION.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.bank}</span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-slate-200">{item.dropCardsCount} ta</strong> ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    className="h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setCurrentPage('drop-cards')}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Barcha drop kartalar reyestrini ko'rish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Threat Incident Feed and Rule Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Stream Feed */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>So'nggi Aniqlangan Kritik Insidentlar Oqimi</span>
            </h2>
            <span className="text-xs text-slate-400">Jonli oqim</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {dropCards.slice(0, 4).map((card) => (
              <div
                key={card.id}
                onClick={() => setInspectingDropCard(card)}
                className="py-3 flex items-start justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">{card.maskedCardNumber}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {card.bankName}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-900">
                      Score: {card.riskScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{card.cardHolder} · {card.dropPatternType}</p>
                  <p className="text-[11px] text-slate-500">Sana: {card.blockedDate} · {card.transactionCount} ta operatsiya</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-red-400 block tabular-nums">
                    {formatUzs(card.totalTurnover)}
                  </span>
                  <span className="text-[11px] text-blue-400 hover:underline">
                    Dossye →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Humo Rules Engine Summary */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Humo Kliring Qoidalari Bo'yicha Ko'rsatkichlar</span>
            </h2>
            <button
              onClick={() => setCurrentPage('humo-clearing')}
              className="text-xs text-blue-400 hover:underline"
            >
              Batafsil tahlil →
            </button>
          </div>

          <div className="space-y-3">
            {humoClearingFiles[0]?.rulesTriggered.map((rule, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{rule.ruleCode}</span>
                    <span className="text-xs font-semibold text-slate-200">{rule.ruleName}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {rule.triggerCount} marta
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Aniqlangan shubhali summa:</span>
                  <span className="font-mono text-red-400 font-semibold">{formatUzs(rule.flaggedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>Aniqlangan drop kartalar: {rule.detectedDropsCount} ta</span>
                  <span className="text-emerald-400 font-medium">Holati: Faol monitoringda</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
