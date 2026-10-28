import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  FileCheck2, 
  ScanLine, 
  RotateCcw,
  UserCheck,
  Building,
  CheckSquare,
  Square
} from 'lucide-react';
import { ChargeSlip, AppUser } from '../types';
import { formatCurrency, getDocumentTypeLabel, calcOverdueDays } from '../utils/formatters';

interface HandoverTabProps {
  slips: ChargeSlip[];
  currentUser: AppUser;
  onBatchSubmit: (slipIds: string[]) => void;
  onBatchReceive: (slipIds: string[], remarks?: string) => void;
  onRejectSubmission: (slipId: string, reason: string) => void;
  onSelectSlip: (slip: ChargeSlip) => void;
  onOpenBarcodeScanner: () => void;
}

export const HandoverTab: React.FC<HandoverTabProps> = ({
  slips,
  currentUser,
  onBatchSubmit,
  onBatchReceive,
  onRejectSubmission,
  onSelectSlip,
  onOpenBarcodeScanner,
}) => {
  // Lane 1: Pending Submission (外勤持有中)
  const pendingSubmissionSlips = slips.filter(s => s.status === 'PENDING_SUBMISSION');

  // Lane 2: Submitted Pending Receipt (已登記繳交，會計尚未收件)
  const pendingReceiptSlips = slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT');

  // Completed Handovers (最近收件完成紀錄)
  const recentHandovers = slips
    .filter(s => s.submissionDate && s.receiptDate)
    .sort((a, b) => (b.receiptDate || '').localeCompare(a.receiptDate || ''))
    .slice(0, 8);

  // Selection states
  const [selectedToSubmit, setSelectedToSubmit] = useState<string[]>([]);
  const [selectedToReceive, setSelectedToReceive] = useState<string[]>([]);

  // Filter lane 1 by my own tasks if current user is delivery / onsite
  const [onlyMyTasks, setOnlyMyTasks] = useState(
    currentUser.role === 'DELIVERY' || currentUser.role === 'ONSITE'
  );

  const displayedToSubmit = onlyMyTasks
    ? pendingSubmissionSlips.filter(s => s.responsiblePersonName === currentUser.name || s.responsiblePersonId === currentUser.code)
    : pendingSubmissionSlips;

  const isAccountant = currentUser.role === 'ACCOUNTANT' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';

  // Toggle selection
  const toggleSubmitSelection = (id: string) => {
    setSelectedToSubmit(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllToSubmit = () => {
    if (selectedToSubmit.length === displayedToSubmit.length) {
      setSelectedToSubmit([]);
    } else {
      setSelectedToSubmit(displayedToSubmit.map(s => s.id));
    }
  };

  const toggleReceiveSelection = (id: string) => {
    setSelectedToReceive(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllToReceive = () => {
    if (selectedToReceive.length === pendingReceiptSlips.length) {
      setSelectedToReceive([]);
    } else {
      setSelectedToReceive(pendingReceiptSlips.map(s => s.id));
    }
  };

  const handleDoBatchSubmit = () => {
    if (selectedToSubmit.length === 0) return;
    onBatchSubmit(selectedToSubmit);
    setSelectedToSubmit([]);
  };

  const handleDoBatchReceive = () => {
    if (selectedToReceive.length === 0) return;
    onBatchReceive(selectedToReceive);
    setSelectedToReceive([]);
  };

  return (
    <div className="space-y-6">
      {/* Golden Rule Highlight Notice Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 uppercase tracking-wide">
              重要稽核規則
            </span>
            <h3 className="font-bold text-sm">「已繳交」不等於「已收件」雙重驗收機制</h3>
          </div>
          <p className="text-xs text-slate-300">
            送貨員回廠登記繳交後，狀態為「待收件確認」；必須由會計人員清點紙本或照片，確認無誤點收後，才正式更新為「已收件」，杜絕虛報繳交。
          </p>
        </div>

        <button
          onClick={onOpenBarcodeScanner}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs shadow-md transition-colors shrink-0"
        >
          <ScanLine className="w-4 h-4" />
          開啟條碼掃描快速點收
        </button>
      </div>

      {/* Two Workflow Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lane 1: 送貨/現場作業員 登記繳交區 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-bold text-slate-800 text-sm">
                  外勤登記繳交區 (F02-01 & F02-02)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">送貨人員／現場人員將單據投入收件箱前於系統登記</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyMyTasks}
                  onChange={(e) => setOnlyMyTasks(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>僅看本人 ({currentUser.name})</span>
              </label>
            </div>
          </div>

          {/* Subheader action */}
          <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between text-xs">
            <button
              onClick={toggleSelectAllToSubmit}
              disabled={displayedToSubmit.length === 0}
              className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium disabled:opacity-40"
            >
              {selectedToSubmit.length > 0 && selectedToSubmit.length === displayedToSubmit.length ? (
                <CheckSquare className="w-4 h-4 text-amber-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>全選 ({displayedToSubmit.length} 筆)</span>
            </button>

            <button
              onClick={handleDoBatchSubmit}
              disabled={selectedToSubmit.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>批次登記繳交 ({selectedToSubmit.length})</span>
            </button>
          </div>

          {/* Slips List */}
          <div className="p-4 divide-y divide-slate-100 flex-1 max-h-[480px] overflow-y-auto space-y-2">
            {displayedToSubmit.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                目前沒有待繳交的簽帳單
              </div>
            ) : (
              displayedToSubmit.map((slip) => {
                const isSelected = selectedToSubmit.includes(slip.id);
                const overdueDays = calcOverdueDays(slip.expectedDueDate);

                return (
                  <div
                    key={slip.id}
                    className={`pt-2 pb-2.5 px-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSubmitSelection(slip.id)}
                          className="mt-0.5 text-slate-400 hover:text-blue-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectSlip(slip)}
                              className="font-mono font-bold text-slate-900 hover:text-indigo-600 text-xs"
                            >
                              {slip.id}
                            </button>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {getDocumentTypeLabel(slip.documentType)}
                            </span>
                            {overdueDays > 0 && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                                逾期 {overdueDays} 天
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-slate-800 text-xs mt-0.5">
                            {slip.customerName}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>交易日: {slip.transactionDate}</span>
                            <span>負責人: <strong>{slip.responsiblePersonName}</strong></span>
                            <span>期限: {slip.expectedDueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatCurrency(slip.amount)}
                        </div>
                        <button
                          onClick={() => onBatchSubmit([slip.id])}
                          className="mt-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-medium shadow-xs transition-colors"
                        >
                          登記繳交
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lane 2: 會計專屬 收件點收確認區 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h3 className="font-bold text-slate-800 text-sm">
                  會計收件確認與點收區 (F02-03)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">外勤已投單，會計人員實體驗收並確認收訖蓋章</p>
            </div>

            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              待點收 {pendingReceiptSlips.length} 筆
            </span>
          </div>

          {/* Subheader action */}
          <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs">
            <button
              onClick={toggleSelectAllToReceive}
              disabled={pendingReceiptSlips.length === 0}
              className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium disabled:opacity-40"
            >
              {selectedToReceive.length > 0 && selectedToReceive.length === pendingReceiptSlips.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>全選 ({pendingReceiptSlips.length} 筆)</span>
            </button>

            {isAccountant ? (
              <button
                onClick={handleDoBatchReceive}
                disabled={selectedToReceive.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>會計確認批次收件 ({selectedToReceive.length})</span>
              </button>
            ) : (
              <span className="text-[11px] text-amber-700">
                (僅會計人員與主管具收件核准權限)
              </span>
            )}
          </div>

          {/* Slips List */}
          <div className="p-4 divide-y divide-slate-100 flex-1 max-h-[480px] overflow-y-auto space-y-2">
            {pendingReceiptSlips.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                目前沒有待收件確認的簽帳單
              </div>
            ) : (
              pendingReceiptSlips.map((slip) => {
                const isSelected = selectedToReceive.includes(slip.id);

                return (
                  <div
                    key={slip.id}
                    className={`pt-2 pb-2.5 px-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleReceiveSelection(slip.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectSlip(slip)}
                              className="font-mono font-bold text-slate-900 hover:text-indigo-600 text-xs"
                            >
                              {slip.id}
                            </button>
                            <span className="text-[10px] text-blue-700 bg-blue-100 font-semibold px-2 py-0.5 rounded-full">
                              待會計點收
                            </span>
                          </div>

                          <div className="font-semibold text-slate-800 text-xs mt-0.5">
                            {slip.customerName}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span>繳交人: <strong>{slip.submittedBy}</strong></span>
                              <span>繳交時間: {slip.submissionDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatCurrency(slip.amount)}
                        </div>

                        {isAccountant ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              onClick={() => onRejectSubmission(slip.id, '會計清點收件箱未見實體紙本，退回重繳')}
                              className="px-2 py-1 text-[10px] text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-md font-medium"
                              title="退回外勤更正 (F02-05)"
                            >
                              退回
                            </button>
                            <button
                              onClick={() => onBatchReceive([slip.id])}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold shadow-xs transition-colors"
                            >
                              確認收件
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-1">待會計確認</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Completed Handover History Timeline (F02-04) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              最近交接與實體收件成功紀錄 (F02-04 查詢交接紀錄)
            </h3>
          </div>
          <span className="text-xs text-slate-500">完整記載繳交人、收件人與時間戳記</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {recentHandovers.map((slip) => (
            <div
              key={slip.id}
              onClick={() => onSelectSlip(slip)}
              className="bg-slate-50 hover:bg-indigo-50/50 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{slip.id}</span>
                <span className="font-bold text-indigo-700">{formatCurrency(slip.amount)}</span>
              </div>
              <div className="font-medium text-slate-800 line-clamp-1">{slip.customerName}</div>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span>繳交: {slip.submittedBy}</span>
                  <span className="text-slate-400">{slip.submissionDate?.slice(5)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-800">
                  <span>點收: {slip.receivedBy}</span>
                  <span className="text-emerald-700">{slip.receiptDate?.slice(5)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
