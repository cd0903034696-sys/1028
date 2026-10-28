import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { ChargeSlip, AppUser } from '../types';
import { parseSlipsFromCsv, generateSampleCsvTemplate } from '../utils/csv';
import { formatCurrency } from '../utils/formatters';

interface ImportSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSlips: ChargeSlip[];
  currentUser: AppUser;
  onImportSlips: (slips: ChargeSlip[]) => void;
}

export const ImportSlipsModal: React.FC<ImportSlipsModalProps> = ({
  isOpen,
  onClose,
  existingSlips,
  currentUser,
  onImportSlips,
}) => {
  if (!isOpen) return null;

  const [csvText, setCsvText] = useState('');
  const [parsedSlips, setParsedSlips] = useState<Partial<ChargeSlip>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleDownloadTemplate = () => {
    const template = generateSampleCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '簽帳單匯入範本.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setCsvText(content);
        analyzeCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const analyzeCsv = (text: string) => {
    const { slips, errors } = parseSlipsFromCsv(text);
    
    // Check duplicates against existingSlips
    const finalErrors = [...errors];
    const existingIds = new Set(existingSlips.map(s => s.id.toLowerCase()));
    const seenIds = new Set<string>();

    const validatedSlips = slips.map((s, idx) => {
      const idKey = s.id?.toLowerCase() || '';
      if (existingIds.has(idKey)) {
        finalErrors.push(`簽帳單編號「${s.id}」在系統內已存在，無法重複匯入`);
      }
      if (seenIds.has(idKey)) {
        finalErrors.push(`CSV 內部有重複編號「${s.id}」`);
      }
      seenIds.add(idKey);
      return s;
    });

    setParsedSlips(validatedSlips);
    setParseErrors(finalErrors);
    setIsAnalyzed(true);
  };

  const handleConfirmImport = () => {
    if (parsedSlips.length === 0 || parseErrors.length > 0) return;

    const fullSlips: ChargeSlip[] = parsedSlips.map((s) => ({
      id: s.id!,
      orderNo: s.orderNo || `ORD-${s.id}`,
      customerName: s.customerName!,
      transactionDate: s.transactionDate || new Date().toISOString().slice(0, 10),
      amount: s.amount || 0,
      accountingAmount: s.accountingAmount || s.amount || 0,
      responsiblePersonId: s.responsiblePersonId || 'DLV-01',
      responsiblePersonName: s.responsiblePersonName || '王大明',
      responsiblePersonRole: s.responsiblePersonRole || '送貨人員',
      documentType: s.documentType || 'DELIVERY_SLIP',
      expectedDueDate: s.expectedDueDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      status: 'PENDING_SUBMISSION',
      auditStatus: 'PENDING',
      notes: s.notes,
      trackingLogs: [],
      historyLogs: [
        {
          id: `hist-import-${Date.now()}-${s.id}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          operator: currentUser.name,
          operatorRole: currentUser.roleTitle,
          action: 'CSV 批次匯入 (F01-05)',
          details: `由使用者批次匯入驗證建立，金額 NT$ ${s.amount}`,
        },
      ],
    }));

    onImportSlips(fullSlips);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">批次匯入簽帳單資料 (F01-05)</h2>
              <p className="text-xs text-slate-300">支援 CSV／Excel 匯出格式，自動檢驗欄位與單號唯一性</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Top Actions: Template Download & File Picker */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs transition-colors">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>選擇 CSV 檔案上傳</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-400">或直接貼上下方文字</span>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-semibold text-xs"
            >
              <Download className="w-4 h-4" />
              下載標準 CSV 範本檔案
            </button>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              CSV 資料內容 (可直接貼上，第一行為欄位標題)
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setIsAnalyzed(false);
              }}
              placeholder="簽帳單編號,銷貨單號,客戶名稱,交易日期,簽帳金額,帳務金額,負責人代號,負責人姓名,文件類型,預計繳交日期,備註說明
CS-202610-030,ORD-202610-8830,台灣高鐵運務處,2026-10-26,89000,89000,DLV-01,王大明,送貨簽帳單,2026-10-29,車站備品月簽"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-[11px]"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => analyzeCsv(csvText)}
              disabled={!csvText.trim()}
              className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              解析與驗證資料
            </button>
            {isAnalyzed && (
              <span className="text-slate-500">
                驗證結果: 解析成功 {parsedSlips.length} 筆，錯誤 {parseErrors.length} 項
              </span>
            )}
          </div>

          {/* Validation Errors Box */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl space-y-1 text-rose-800">
              <div className="font-bold flex items-center gap-1 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                資料檢核未通過 ({parseErrors.length} 項錯誤)：
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {parseErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation Preview Table */}
          {isAnalyzed && parsedSlips.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold text-slate-800 flex items-center justify-between">
                <span>預覽匯入清單 ({parsedSlips.length} 筆)</span>
                {parseErrors.length === 0 && (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" /> 欄位檢核全數通過，可直接匯入
                  </span>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2">單號</th>
                      <th className="p-2">客戶名稱</th>
                      <th className="p-2 text-right">簽帳金額</th>
                      <th className="p-2">負責人</th>
                      <th className="p-2">文件類型</th>
                      <th className="p-2">預計繳交日</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedSlips.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2 font-mono font-bold text-slate-800">{s.id}</td>
                        <td className="p-2 font-medium">{s.customerName}</td>
                        <td className="p-2 text-right font-bold text-indigo-700">{formatCurrency(s.amount)}</td>
                        <td className="p-2">{s.responsiblePersonName}</td>
                        <td className="p-2 text-slate-600">{s.documentType}</td>
                        <td className="p-2 text-slate-600">{s.expectedDueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!isAnalyzed || parsedSlips.length === 0 || parseErrors.length > 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors shadow-xs"
            >
              確認匯入 ({parsedSlips.length} 筆)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
