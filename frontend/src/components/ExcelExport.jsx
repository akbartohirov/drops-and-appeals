import React from 'react';
import { Download } from 'lucide-react';

const ExcelExport = ({ data, headers, filename = 'eksport' }) => {
  
  const handleExport = async () => {
    let resolvedData = data;
    if (typeof data === 'function') {
      try {
        resolvedData = await data();
      } catch (err) {
        alert("Eksport qilishda ma'lumotlarni yuklashda xatolik yuz berdi: " + err.message);
        return;
      }
    }

    if (!resolvedData || resolvedData.length === 0) {
      alert("Eksport qilish uchun ma'lumotlar mavjud emas!");
      return;
    }

    // 1. Generate CSV content
    // Prepare header row
    const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
    
    // Prepare data rows
    const dataRows = resolvedData.map(item => {
      return headers.map(h => {
        let val = item[h.key];
        
        // Handle undefined or null
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'number') {
          val = String(val);
        } else {
          val = String(val);
        }

        // Format dates, card numbers, or amounts if needed in Excel
        if (h.format) {
          val = h.format(val);
        }

        // Escape double quotes
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\n');

    // 2. Prepend UTF-8 BOM so Excel opens Uzbek special chars correctly (o', g', etc.)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 3. Trigger Download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-white border border-outline-variant text-primary px-4 py-2.5 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-all active:scale-95 shadow-sm"
      type="button"
      title="Ma'lumotlarni Excel (CSV) fayliga yuklab olish"
    >
      <Download className="w-4 h-4" />
      <span>Eksport Excel</span>
    </button>
  );
};

export default ExcelExport;
