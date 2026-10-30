import React, { useState, useEffect } from 'react';
import { useAntifraud } from '../context/AntifraudContext';
import { apiService } from '../services/api';
import {
  Database,
  Play,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Table,
  Columns,
  Download,
  Search,
  Code2,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TableColumn {
  name: string;
  type: string;
}

interface TableInfo {
  name: string;
  approximateRows: number;
  columns: TableColumn[];
}

export const SqlExplorerPage: React.FC = () => {
  const { currentUser } = useAntifraud();

  const [targetDb, setTargetDb] = useState<'clearing' | 'main'>('clearing');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [searchTable, setSearchTable] = useState('');
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);

  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT * FROM staging_transactions LIMIT 25;'
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    executionTimeMs: number;
    command?: string;
  } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Faqat Admin ruxsatini tekshirish
  const isAdmin = currentUser?.role === 'Admin';

  // Jadvallar ro'yxatini yuklash
  const loadTables = async () => {
    try {
      const res = await apiService.getSqlTables(targetDb);
      setTables(res.tables || []);
    } catch (err: any) {
      console.error('Jadvallarni yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTables();
    }
  }, [targetDb, isAdmin]);

  // SQL so'rovni bajarish
  const handleExecute = async () => {
    if (!sqlQuery.trim()) return;

    setIsExecuting(true);
    setQueryError(null);

    try {
      const res = await apiService.executeSql(sqlQuery, targetDb);
      setExecutionResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'Xatolik yuz berdi');
      setExecutionResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // CSV yuklab olish
  const handleExportCsv = () => {
    if (!executionResult || executionResult.rows.length === 0) return;

    const headers = executionResult.columns.join(',');
    const rows = executionResult.rows.map((row) =>
      executionResult.columns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sql_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON yuklab olish
  const handleExportJson = () => {
    if (!executionResult || executionResult.rows.length === 0) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(executionResult.rows, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `sql_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  // Ruxsat yo'q bo'lsa
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mb-4 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Kirish Taqiqlangan</h2>
        <p className="text-sm text-slate-400 max-w-md">
          Ushbu sahifa faqat tizim administratorlari uchun mo'ljallangan. Sizda PostgreSQL bazasida to'g'ridan-to'g'ri so'rovlar bajarish huquqi mavjud emas.
        </p>
      </div>
    );
  }

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTable.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                PostgreSQL Explorer
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Admin Faqat
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Postgres bazasidagi jadvallar tuzilishi va to'g'ridan-to'g'ri SQL so'rovlar ijrosi
              </p>
            </div>
          </div>
        </div>

        {/* Database selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTargetDb('clearing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              targetDb === 'clearing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            humo_clearing_p2p (Tranzaksiyalar)
          </button>
          <button
            onClick={() => setTargetDb('main')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              targetDb === 'main'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            drops_appeals_db (Asosiy)
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar Tables + Query Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Tables List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-blue-400" />
                Jadvallar ({tables.length})
              </h3>
              <button
                onClick={loadTables}
                title="Yangilash"
                className="text-slate-400 hover:text-blue-400 transition-colors p-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Jadvalni qidirish..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
              {filteredTables.map((t) => (
                <div
                  key={t.name}
                  onClick={() => {
                    setSelectedTable(t);
                    setSqlQuery(`SELECT * FROM ${t.name} LIMIT 50;`);
                  }}
                  className={`px-2.5 py-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-all group ${
                    selectedTable?.name === t.name
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="font-mono truncate">{t.name}</span>
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 font-mono">
                    ~{t.approximateRows.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Selected Table Columns */}
            {selectedTable && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 truncate">
                    <Columns className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {selectedTable.name} ustunlari:
                  </span>
                </div>
                <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 text-[11px] font-mono">
                  {selectedTable.columns.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between px-2 py-1 bg-slate-900/60 rounded text-slate-400"
                    >
                      <span className="text-slate-300">{c.name}</span>
                      <span className="text-[10px] text-slate-500">{c.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Queries */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tezkor So'rovlar
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => setSqlQuery('SELECT COUNT(*) as total_trx FROM staging_transactions;')}
                className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>Tranzaksiyalar soni</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
              <button
                onClick={() =>
                  setSqlQuery(`SELECT 
  card_number, pinfl, age, total_transactions, debit_count, debit_sum, credit_count, credit_sum 
FROM suspect_cards_analysis 
ORDER BY credit_sum DESC, debit_sum DESC 
LIMIT 50;`)
                }
                className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>Shubhali kartalar (19 ta)</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
              <button
                onClick={() =>
                  setSqlQuery(`SELECT card_number, pinfl, client_code, date_registered, age 
FROM target_clients 
LIMIT 50;`)
                }
                className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>Target yangi kartalar</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
              <button
                onClick={() =>
                  setSqlQuery(`SELECT 
  relname as table_name, 
  n_live_tup as approximate_rows 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;`)
                }
                className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-blue-300 transition-colors flex items-center justify-between"
              >
                <span>Barcha jadvallar statistikasi</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Area: SQL Editor + Results Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Query Editor Box */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>SQL Tahrirlagich</span>
                <span className="text-[10px] text-slate-500 font-mono">(Ctrl + Enter bilan bajarish)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSqlQuery('')}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Tozalash
                </button>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !sqlQuery.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-900/30"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isExecuting ? 'Bajarilmoqda...' : 'Bajarish'}
                </button>
              </div>
            </div>

            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              placeholder="SELECT * FROM table_name..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-blue-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Error Message */}
          {queryError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200 mb-1">SQL Xatolik yuz berdi:</p>
                <p className="font-mono text-[11px] whitespace-pre-wrap">{queryError}</p>
              </div>
            </div>
          )}

          {/* Results Area */}
          {executionResult && (
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden space-y-3">
              {/* Stats Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-4 text-slate-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    {executionResult.executionTimeMs} ms
                  </span>
                  <span>
                    Qatorlar: <strong className="text-white">{executionResult.rowCount.toLocaleString()}</strong> ta
                  </span>
                  {executionResult.command && (
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                      {executionResult.command}
                    </span>
                  )}
                </div>

                {executionResult.rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCsv}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      CSV
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      JSON
                    </button>
                  </div>
                )}
              </div>

              {/* Table Render */}
              {executionResult.columns.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Buyruq muvaffaqiyatli bajarildi (Qaytarilgan jadval yo'q).
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-slate-900/90 text-slate-300 sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold text-[11px] text-slate-500 w-12 text-center">#</th>
                        {executionResult.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {executionResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 text-slate-600 text-center">{idx + 1}</td>
                          {executionResult.columns.map((col) => {
                            const val = row[col];
                            const cellText = val === null ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                            const cellId = `${idx}-${col}`;
                            const isNull = val === null;

                            return (
                              <td
                                key={col}
                                onClick={() => copyToClipboard(cellText, cellId)}
                                title="Nusxa olish uchun bosing"
                                className={`py-2 px-3 whitespace-nowrap cursor-pointer transition-colors max-w-xs truncate ${
                                  isNull ? 'text-slate-600 italic' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                                }`}
                              >
                                {copiedCell === cellId ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Nusxalandi
                                  </span>
                                ) : (
                                  cellText
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

