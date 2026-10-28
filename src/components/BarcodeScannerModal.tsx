import React, { useState } from 'react';
import { X, ScanLine, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import { ChargeSlip, AppUser } from '../types';
import { formatCurrency, getDocumentTypeLabel } from '../utils/formatters';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slips: ChargeSlip[];
  currentUser: AppUser;
  onQuickReceive: (slipId: string, remarks?: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  slips,
  currentUser,
  onQuickReceive,
}) => {
  if (!isOpen) return null;

  const [inputCode, setInputCode] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<{
    success: boolean;
    slipId: string;
    message: string;
  } | null>(null);

  // Slips awaiting receipt
  const pendingReceiptSlips = slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT');
  const otherSlips = slips.filter(s => s.status === 'PENDING_SUBMISSION');

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    const matchedSlip = slips.find(s => s.id.toUpperCase() === code || s.orderNo?.toUpperCase() === code);

    if (!matchedSlip) {
      setLastScannedResult({
        success: false,
        slipId: code,
        message: `查無單號「${code}」，請確認簽帳單或出貨條碼是否正確。`,
      });
      return;
    }

    if (matchedSlip.status === 'RECEIVED_PENDING_AUDIT' || matchedSlip.status === 'AUDITED' || matchedSlip.status === 'CLOSED') {
      setLastScannedResult({
        success: false,
        slipId: matchedSlip.id,
        message: `單號「${matchedSlip.id}」已經於 ${matchedSlip.receiptDate} 完成收件，無須重複掃碼。`,
      });
      return;
    }

    // Success receive!
    onQuickReceive(matchedSlip.id, '經由條碼掃描機批次刷讀收件');
    setLastScannedResult({
      success: true,
      slipId: matchedSlip.id,
      message: `【掃描成功！】簽帳單「${matchedSlip.id}」已完成點收，金額 ${formatCurrency(matchedSlip.amount)}，狀態更新為「已收件／待核對」。`,
    });
    setInputCode('');
  };

  const handleQuickClick = (id: string) => {
    setInputCode(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">條碼／QR Code 快速收件掃描台 (第四階段自動化)</h2>
              <p className="text-xs text-slate-300">模擬光學刷單掃描，大幅減少會計人工作業時間</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Simulated Scanner Graphic / Viewfinder */}
          <div className="relative border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-2xl p-6 text-center space-y-3 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
            
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-indigo-200 shadow-md flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>

            <div>
              <p className="font-bold text-slate-800 text-sm">條碼光學辨識感應區</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                請輸入簽帳單編號或銷貨單號，或點選下方待收單據直接模擬刷入
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="輸入編號如: CS-202610-004"
                className="flex-1 px-3 py-2 bg-white border border-indigo-300 rounded-xl font-mono text-center font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                刷讀收件
              </button>
            </form>
          </div>

          {/* Scanned Result Banner */}
          {lastScannedResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                lastScannedResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {lastScannedResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-0.5">
                <span className="font-bold">{lastScannedResult.slipId}</span>
                <p>{lastScannedResult.message}</p>
              </div>
            </div>
          )}

          {/* Quick Click List of Waiting Slips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>待收件確認清單 (點選即帶入單號刷件):</span>
              <span className="text-indigo-600">{pendingReceiptSlips.length} 筆待確認</span>
            </div>

            {pendingReceiptSlips.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400">
                目前沒有待收件確認的簽單！
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {pendingReceiptSlips.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleQuickClick(s.id)}
                    className="flex items-center justify-between p-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700">{s.id}</span>
                      <span className="text-slate-800">{s.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{formatCurrency(s.amount)}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                        {s.submittedBy} 剛繳交
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
          >
            完成關閉
          </button>
        </div>
      </div>
    </div>
  );
};
