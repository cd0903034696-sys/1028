import React from 'react';
import { 
  Building2, 
  Users, 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ScanLine, 
  FlaskConical, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { AppUser, ChargeSlip } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  onSelectUser: (user: AppUser) => void;
  slips: ChargeSlip[];
  onOpenAcceptanceTest: () => void;
  onOpenBarcodeScanner: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  slips,
  onOpenAcceptanceTest,
  onOpenBarcodeScanner,
  onResetData,
}) => {
  // Compute KPI stats
  const totalCount = slips.length;
  const pendingSubmissionCount = slips.filter(s => s.status === 'PENDING_SUBMISSION').length;
  const pendingReceiptCount = slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT').length;
  const anomalyCount = slips.filter(s => s.status === 'ANOMALY' || s.auditStatus === 'AMOUNT_MISMATCH' || s.auditStatus === 'MISSING_SLIP').length;
  const auditedAndClosedCount = slips.filter(s => s.status === 'AUDITED' || s.status === 'CLOSED' || s.status === 'EXCEPTION_CLOSED').length;
  const totalAccountingSum = slips.reduce((sum, s) => sum + (s.accountingAmount || s.amount), 0);
  const completionRate = totalCount > 0 ? Math.round((auditedAndClosedCount / totalCount) * 100) : 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  簽帳單管理與帳務核對系統
                </h1>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  2026年10月 月結週期
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 hidden sm:flex">
                <span>單據可追蹤</span>
                <span>•</span>
                <span>責任可查詢</span>
                <span>•</span>
                <span>缺單能預警</span>
                <span>•</span>
                <span>帳務可核對</span>
              </p>
            </div>
          </div>

          {/* Quick Utility Actions & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Acceptance Test Runner Button */}
            <button
              onClick={onOpenAcceptanceTest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors shadow-xs"
              title="執行規格書第八章 AT-01 ~ AT-10 驗收測試規格"
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden md:inline">驗收測試規格 (AT-01~10)</span>
              <span className="md:hidden">驗收情境</span>
            </button>

            {/* Quick Barcode Scanner for Accounting / Receiver */}
            <button
              onClick={onOpenBarcodeScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="模擬條碼／QR Code 掃描快速收件"
            >
              <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">掃碼收件模擬</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="重設為預設展示資料"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Role Switcher */}
            <div className="relative flex items-center pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs transition-colors">
                <div className={`w-7 h-7 rounded-full ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-slate-800 leading-tight flex items-center gap-1">
                    {currentUser.name}
                    <span className="text-[10px] text-slate-500 font-normal">({currentUser.code})</span>
                  </div>
                  <div className="text-[10px] text-indigo-700 font-medium">
                    {currentUser.roleTitle}
                  </div>
                </div>

                <div className="pl-1">
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const found = allUsers.find(u => u.id === e.target.value);
                      if (found) onSelectUser(found);
                    }}
                    className="bg-transparent font-medium text-slate-700 text-xs focus:outline-hidden cursor-pointer"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.roleTitle.split(' ')[0]} - {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">本月銷貨總單數:</span>
              <span className="font-bold text-slate-800">{totalCount} 筆</span>
              <span className="text-slate-400">({formatCurrency(totalAccountingSum)})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-500">待繳交 (外勤手頭):</span>
              <span className="font-semibold text-amber-700">{pendingSubmissionCount} 筆</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-500">已繳／待會計收件:</span>
              <span className="font-semibold text-blue-700">{pendingReceiptCount} 筆</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-slate-500">缺單/金額異常:</span>
              <span className="font-bold text-rose-700">{anomalyCount} 筆</span>
            </div>
          </div>

          {/* Month-End Close Rate Progress */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 font-medium">月結完成率:</span>
              <span className="font-bold text-emerald-700">{completionRate}%</span>
              <span className="text-slate-400">({auditedAndClosedCount}/{totalCount})</span>
            </div>
            <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
