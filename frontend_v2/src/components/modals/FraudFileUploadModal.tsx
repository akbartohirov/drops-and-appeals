import React, { useState } from 'react';
import { useAntifraud } from '../../context/AntifraudContext';
import { ModalDialog } from '../common/ModalDialog';
import { formatUzs } from '../../utils/rules';
import { 
  X, 
  Upload, 
  FileText, 
  FileArchive, 
  Trash2, 
  Download, 
  Check, 
  ShieldAlert,
  Paperclip,
  FileCheck
} from 'lucide-react';
import { AttachedFile } from '../../types/antifraud';

export const FraudFileUploadModal: React.FC = () => {
  const { inspectingFraudFiles, setInspectingFraudFiles, addFileToFraudCase, removeFileFromFraudCase } = useAntifraud();

  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newFileType, setNewFileType] = useState<AttachedFile['fileType']>('IIB arizasi');
  const [fileSizeMb, setFileSizeMb] = useState('1.5');
  const [uploadSuccessToast, setUploadSuccessToast] = useState(false);

  if (!inspectingFraudFiles) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !newFileName.trim()) return;

    const rawName = selectedFile ? selectedFile.name : newFileName.trim();
    const formattedName = rawName.includes('.') ? rawName : `${rawName}.pdf`;
    const sizeNumber = selectedFile ? selectedFile.size / (1024 * 1024) : parseFloat(fileSizeMb) || 1.2;

    try {
      await addFileToFraudCase(
        inspectingFraudFiles.id,
        {
          name: formattedName,
          fileType: newFileType,
          size: `${Math.max(0.1, sizeNumber).toFixed(1)} MB`,
          fileSizeKb: Math.round(sizeNumber * 1024),
        },
        selectedFile || undefined
      );

      setNewFileName('');
      setSelectedFile(null);
      setUploadSuccessToast(true);
      setTimeout(() => setUploadSuccessToast(false), 2500);
    } catch (err: any) {
      alert(err?.message || 'Faylni biriktirishda xatolik!');
    }
  };

  const handleDownload = (file: AttachedFile) => {
    if (file.filePath) {
      const a = document.createElement('a');
      a.href = file.filePath;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Generate a dummy downloadable blob text
    const blob = new Blob([`SENTINEL ANTIFRAUD HUJJAT AUDITI\n\nFayl nomi: ${file.name}\nHolat: ${inspectingFraudFiles.caseNumber}\nYuklangan: ${file.uploadedAt}\nMas'ul: ${file.uploadedBy}\n\nUshbu hujjat bank maxfiy tergov materiallari reyestriga kiritilgan.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ModalDialog
      isOpen={Boolean(inspectingFraudFiles)}
      onClose={() => setInspectingFraudFiles(null)}
      ariaLabel="Holatga aloqador fayllar va dalillar"
      maxWidthClass="max-w-3xl"
    >
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Paperclip className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Holatga aloqador fayllar va dalillar</h3>
                <span className="font-mono text-xs text-blue-400 font-semibold px-2 py-0.5 rounded bg-blue-950 border border-blue-900">
                  {inspectingFraudFiles.caseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kategoriya: {inspectingFraudFiles.fraudCategory} · Gumonlanuvchi: {inspectingFraudFiles.suspectName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setInspectingFraudFiles(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs md:text-sm">
          {/* Quick Case Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-500 block">Jabrlanuvchi:</span>
              <span className="font-semibold text-slate-200 truncate block">{inspectingFraudFiles.victimName}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Drop Karta:</span>
              <span className="font-mono text-slate-200 font-semibold truncate block">{inspectingFraudFiles.suspectDropCard}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Zarar summasi:</span>
              <span className="font-mono text-red-400 font-semibold tabular-nums">
                {formatUzs(inspectingFraudFiles.totalDamage)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Muzlatilgan summa:</span>
              <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                {formatUzs(inspectingFraudFiles.blockedAmount)}
              </span>
            </div>
          </div>

          {/* Upload Form Box */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Yangi hujjat yoki fayl biriktirish</span>
              </span>
              {uploadSuccessToast && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
                  <Check className="w-3 h-3" />
                  Fayl muvaffaqiyatli qo'shildi!
                </span>
              )}
            </div>

            <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[11px] text-slate-400">Fayl tanlash:</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f) setNewFileName(f.name);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-300 cursor-pointer"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[11px] text-slate-400">Hujjat turi:</label>
                <select
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="IIB arizasi">IIB arizasi / Talabnomasi</option>
                  <option value="Sud qarori">Sud ajrimi / Qarori</option>
                  <option value="Bank xulosasi">Bank ekspertizasi xulosasi</option>
                  <option value="Skrinshot/Chek">Skrinshot / To'lov cheki</option>
                  <option value="Tushuntirish xati">Mijoz tushuntirish xati</option>
                  <option value="DWH auditi">DWH tranzaksiyalar auditi</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Biriktirish</span>
                </button>
              </div>
            </form>
          </div>

          {/* Attached Files List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Biriktirilgan fayllar ro'yxati ({inspectingFraudFiles.attachedFiles?.length || 0}):</span>
              <span className="text-[11px] text-slate-500">Tergov va audit uchun barcha hujjatlar</span>
            </div>

            {inspectingFraudFiles.attachedFiles && inspectingFraudFiles.attachedFiles.length > 0 ? (
              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                {inspectingFraudFiles.attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded bg-slate-800 text-blue-400 shrink-0">
                        {file.name.endsWith('.zip') ? (
                          <FileArchive className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 text-xs truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {file.fileType}
                          </span>
                          <span>·</span>
                          <span className="font-mono">{file.size}</span>
                          <span>·</span>
                          <span>{file.uploadedAt}</span>
                          <span>·</span>
                          <span>{file.uploadedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Yuklab olish"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                      <button
                        onClick={() => removeFileFromFraudCase(inspectingFraudFiles.id, file.id)}
                        className="p-1.5 rounded-lg border border-red-900/50 bg-red-950/30 hover:bg-red-900/40 text-red-400 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                Ushbu firibgarlik holati bo'yicha hali fayl biriktirilmagan. Yuqoridagi forma orqali biriktiring.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Fayllar xavfsiz AES-256 shifrlangan bank serverida saqlanadi.
          </div>
          <button
            onClick={() => setInspectingFraudFiles(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </ModalDialog>
  );
};
