import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Search,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchField?: (row: T) => string;
  pageSizeDefault?: number;
  emptyMessage?: string;
  extraHeaderActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
  exportFileName?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Qidirish...',
  searchField,
  pageSizeDefault = 10,
  emptyMessage = 'Ma\'lumotlar topilmadi',
  extraHeaderActions,
  onRowClick,
  exportFileName = 'antifrod_reyestr_eksport.csv',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchField) {
        return searchField(row).toLowerCase().includes(term);
      }
      return Object.values(row as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchField]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const exportToCsv = () => {
    if (!data.length) return;
    const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
    const rows = sortedData.map((item) =>
      columns
        .map((col) => {
          const val = (item as Record<string, unknown>)[col.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Table Action Controls Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Tozalash
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {extraHeaderActions}

          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 rounded-lg text-xs font-medium transition-colors"
            title="CSV formatida yuklab olish"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="whitespace-nowrap">Eksport (CSV)</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span>Satrlar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Surface */}
      <div
        tabIndex={0}
        role="region"
        aria-label={searchPlaceholder || "Ma'lumotlar jadvali"}
        className="overflow-x-auto max-w-full focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      >
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const alignClass =
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`px-4 py-3.5 select-none ${alignClass} ${
                      col.sortable !== false ? 'cursor-pointer hover:text-slate-200 transition-colors' : ''
                    }`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      <span className="whitespace-nowrap">{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';
                    const cellValue = (row as Record<string, unknown>)[col.key];

                    return (
                      <td key={col.key} className={`px-4 py-3 text-slate-300 ${alignClass}`}>
                        {col.render ? col.render(row) : (cellValue as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                    <span className="text-sm">{emptyMessage}</span>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-blue-400 hover:underline mt-1"
                      >
                        Qidiruv filtrini tozalash
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-slate-400">
        <div>
          Jami: <span className="font-mono text-slate-200 font-semibold">{sortedData.length}</span> ta yozuv
          {sortedData.length > 0 && (
            <span className="ml-1 text-slate-500">
              ({(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, sortedData.length)} ko'rsatilmoqda)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
            title="Oldingi sahifa"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-mono text-slate-300">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
            title="Keyingi sahifa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
