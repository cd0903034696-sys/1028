import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  PhoneCall, 
  MessageSquare, 
  Copy, 
  Check, 
  FileCheck, 
  ShieldAlert, 
  Download, 
  Plus, 
  User, 
  ArrowRight,
  ExternalLink,
  Phone,
  X
} from 'lucide-react';
import { ChargeSlip, AppUser, TrackingLog } from '../types';
import { formatCurrency, calcOverdueDays, getDocumentTypeLabel } from '../utils/formatters';
import { exportSlipsToCsv } from '../utils/csv';

interface MissingTrackingTabProps {
  slips: ChargeSlip[];
  currentUser: AppUser;
  onSelectSlip: (slip: ChargeSlip) => void;
  onAddTrackingLog: (slipId: string, log: Omit<TrackingLog, 'id' | 'timestamp' | 'operatorName'>) => void;
  onConfirmSupplement: (slipId: string) => void;
  onExceptionCloseSlip: (slipId: string, reason: string) => void;
}

export const MissingTrackingTab: React.FC<MissingTrackingTabProps> = ({
  slips,
  currentUser,
  onSelectSlip,
  onAddTrackingLog,
  onConfirmSupplement,
  onExceptionCloseSlip,
}) => {
  // Missing or overdue slips (F05-01: 預期應有但尚未確認收件的簽帳單)
  // Slips not received (status in PENDING_SUBMISSION, SUBMITTED_PENDING_RECEIPT, ANOMALY with missing)
  const missingSlips = slips.filter(s => {
    if (s.status === 'CLOSED' || s.status === 'EXCEPTION_CLOSED') return false;
    const isOverdue = calcOverdueDays(s.expectedDueDate) > 0;
    const isMissingStatus = s.auditStatus === 'MISSING_SLIP' || s.status === 'ANOMALY';
    return isOverdue || isMissingStatus || !s.receiptDate;
  });

  // Sort by overdue days descending
  const sortedMissingSlips = [...missingSlips].sort((a, b) => {
    const daysA = calcOverdueDays(a.expectedDueDate);
    const daysB = calcOverdueDays(b.expectedDueDate);
    return daysB - daysA;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSlipForLog, setSelectedSlipForLog] = useState<ChargeSlip | null>(null);
  const [contactType, setContactType] = useState<'PHONE' | 'LINE' | 'IN_PERSON' | 'EMAIL'>('PHONE');
  const [contactTarget, setContactTarget] = useState('');
  const [responseSummary, setResponseSummary] = useState('');
  const [promisedDate, setPromisedDate] = useState('');

  const [selectedSlipForException, setSelectedSlipForException] = useState<ChargeSlip | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');

  const isAccountant = currentUser.role === 'ACCOUNTANT' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';
  const isSupervisorOrAdmin = currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';

  const totalMissingAmount = sortedMissingSlips.reduce((sum, s) => sum + s.amount, 0);

  // Quick Copy LINE reminder text
  const handleCopyLineReminder = (slip: ChargeSlip) => {
    const overdueDays = calcOverdueDays(slip.expectedDueDate);
    const text = `【財務會計部催單提醒】
同仁您好，簽帳單未繳清單如下：
• 簽帳單號：${slip.id}
• 交易客戶：${slip.customerName}
• 實簽金額：${formatCurrency(slip.amount)}
• 交易日期：${slip.transactionDate}
• 繳交期限：${slip.expectedDueDate} (已逾期 ${overdueDays} 天)
請盡速於本日回廠投入會計點收箱，以免影響月底月結與客戶請款。謝謝合作！`;

    navigator.clipboard.writeText(text);
    setCopiedId(slip.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenAddLog = (slip: ChargeSlip) => {
    setSelectedSlipForLog(slip);
    setContactTarget(slip.responsiblePersonName);
    setResponseSummary('');
    setPromisedDate('');
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlipForLog || !responseSummary.trim()) return;

    onAddTrackingLog(selectedSlipForLog.id, {
      contactType,
      contactTarget,
      targetPhone: selectedSlipForLog.responsiblePersonPhone,
      responseSummary: responseSummary.trim(),
      promisedDate: promisedDate || undefined,
    });
    setSelectedSlipForLog(null);
  };

  const handleExportMissing = () => {
    exportSlipsToCsv(sortedMissingSlips, `月底缺單催辦清單_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleDoExceptionClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlipForException || !exceptionReason.trim()) return;
    onExceptionCloseSlip(selectedSlipForException.id, exceptionReason.trim());
    setSelectedSlipForException(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                缺單追蹤與催辦中心 (F05)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              自動彙整應繳而未到單據，列示外勤負責人、逾期天數與催辦歷程，確保每筆銷貨款項有憑有據
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportMissing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition-colors"
              title="匯出缺單清單 (AT-09)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              匯出缺單報表 (AT-09)
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
            <span className="text-rose-700 font-medium block">列管缺單總筆數</span>
            <div className="text-xl font-bold text-rose-900 mt-1">
              {sortedMissingSlips.length} <span className="text-xs font-normal">筆</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
            <span className="text-amber-800 font-medium block">缺單待收總金額 (風險金額)</span>
            <div className="text-xl font-bold text-amber-900 mt-1">
              {formatCurrency(totalMissingAmount)}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <span className="text-indigo-800 font-medium block">嚴重逾期 (超過 3 天)</span>
            <div className="text-xl font-bold text-indigo-900 mt-1">
              {sortedMissingSlips.filter(s => calcOverdueDays(s.expectedDueDate) >= 3).length} <span className="text-xs font-normal">筆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Slips Cards / List */}
      <div className="space-y-3">
        {sortedMissingSlips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
            🎉 目前無任何缺單！所有預期簽帳單均已確認收件完畢。
          </div>
        ) : (
          sortedMissingSlips.map((slip) => {
            const overdueDays = calcOverdueDays(slip.expectedDueDate);
            const isSevere = overdueDays >= 3;
            const latestLog = slip.trackingLogs[slip.trackingLogs.length - 1];

            return (
              <div
                key={slip.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  isSevere
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/10'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectSlip(slip)}
                        className="font-mono font-bold text-slate-900 hover:text-indigo-600 text-sm hover:underline"
                      >
                        {slip.id}
                      </button>

                      {overdueDays > 0 ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isSevere 
                            ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          已逾期 {overdueDays} 天 (AT-06)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                          即將到期
                        </span>
                      )}

                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {getDocumentTypeLabel(slip.documentType)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{slip.customerName}</h3>
                      <p className="text-xs text-slate-500">
                        交易日: {slip.transactionDate} ｜ 規定期限 (T+3): {slip.expectedDueDate} ｜ 銷貨單號: {slip.orderNo || '-'}
                      </p>
                    </div>

                    {/* Responsible Staff Card */}
                    <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>負責外勤: {slip.responsiblePersonName}</span>
                        <span className="text-slate-500 font-normal">({slip.responsiblePersonRole})</span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <a
                        href={`tel:${slip.responsiblePersonPhone || '0912-345-678'}`}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        {slip.responsiblePersonPhone || '0912-345-678'}
                      </a>
                    </div>

                    {/* Latest Follow-up Log snippet */}
                    {latestLog ? (
                      <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold">
                          <span>最新催單回覆 ({latestLog.timestamp.slice(5)}) - {latestLog.contactTarget}:</span>
                          {latestLog.promisedDate && (
                            <span className="text-indigo-700">
                              承諾補件日: {latestLog.promisedDate}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 italic">「{latestLog.responseSummary}」</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">尚未記錄任何催單通話歷程</p>
                    )}
                  </div>

                  {/* Right Actions & Amount */}
                  <div className="flex flex-col items-start lg:items-end justify-between self-stretch shrink-0 space-y-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <span className="text-slate-400 text-[11px] block">簽帳未繳金額</span>
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(slip.amount)}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Copy LINE message button */}
                      <button
                        onClick={() => handleCopyLineReminder(slip)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium transition-colors"
                        title="一鍵複製格式化 LINE 催單簡訊"
                      >
                        {copiedId === slip.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>已複製文案!</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>複製 LINE 催單文案</span>
                          </>
                        )}
                      </button>

                      {/* Add Tracking Log (F05-05) */}
                      {isAccountant && (
                        <button
                          onClick={() => handleOpenAddLog(slip)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>記錄催單歷程 (F05-05)</span>
                        </button>
                      )}

                      {/* Confirm Supplement (F05-06 & AT-07) */}
                      {isAccountant && (
                        <button
                          onClick={() => onConfirmSupplement(slip.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          title="收到補件確認收件 (AT-07)"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>收到補件確認 (F05-06)</span>
                        </button>
                      )}

                      {/* Exception Close by Supervisor (F05-07) */}
                      {isSupervisorOrAdmin && (
                        <button
                          onClick={() => {
                            setSelectedSlipForException(slip);
                            setExceptionReason('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition-colors"
                          title="無法補件時的主管特案核准結案 (F05-07)"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>特案結案 (F05-07)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Tracking Log Modal */}
      {selectedSlipForLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">記錄缺單催辦歷程 (F05-05)</h3>
                <p className="text-xs text-slate-500">
                  單號: {selectedSlipForLog.id} ｜ 負責外勤: {selectedSlipForLog.responsiblePersonName}
                </p>
              </div>
              <button onClick={() => setSelectedSlipForLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">聯絡方式</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PHONE', 'LINE', 'IN_PERSON', 'EMAIL'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContactType(t)}
                      className={`py-2 rounded-lg border font-medium text-center ${
                        contactType === t
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'PHONE' ? '電話溝通' : t === 'LINE' ? 'LINE訊息' : t === 'IN_PERSON' ? '當面洽詢' : '電子信函'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">受訪／聯絡對象</label>
                <input
                  type="text"
                  value={contactTarget}
                  onChange={(e) => setContactTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  回覆內容及缺單原因說明 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={responseSummary}
                  onChange={(e) => setResponseSummary(e.target.value)}
                  placeholder="例：司機表示已於客戶處簽妥，但遺忘於新竹配銷所辦公室，承諾明天下午回台北時一併補交..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">承諾補件日期</label>
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedSlipForLog(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  儲存催單紀錄
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exception Close Modal */}
      {selectedSlipForException && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-rose-200">
            <div className="flex justify-between items-center border-b pb-3 text-rose-900">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                會計主管特案異常結案 (F05-07)
              </h3>
              <button onClick={() => setSelectedSlipForException(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 space-y-1">
              <span className="font-bold">⚠️ 系統處理規則提醒：</span>
              <p>
                單據無法補件時（如遭遇不可抗力損毀），必須由會計主管填寫核准原因與簽呈案號，<strong>系統不可直接刪除帳務紀錄</strong>，結案後將保留完整稽核軌跡。
              </p>
            </div>

            <form onSubmit={handleDoExceptionClose} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  主管特案核准原因及簽呈案號 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="例：經查本筆出貨客戶已於 10/24 全額電匯入帳無誤，司機正本因雨損毀，檢附客戶採購驗收電子郵件 (案號: ACT-202610-SP01)，主管核准特案結案..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedSlipForException(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shadow-xs"
                >
                  簽核特案結案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
