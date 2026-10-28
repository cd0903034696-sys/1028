import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquarePlus, 
  History, 
  Send, 
  ShieldAlert,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { ChargeSlip, AppUser, TrackingLog } from '../types';
import { formatCurrency, getDocumentTypeLabel, getStatusMeta, getAuditStatusMeta, calcOverdueDays } from '../utils/formatters';

interface SlipDetailModalProps {
  slip: ChargeSlip | null;
  currentUser: AppUser;
  onClose: () => void;
  onSubmitSlip: (slipId: string) => void;
  onReceiveSlip: (slipId: string, remarks?: string) => void;
  onRejectSubmission?: (slipId: string, reason: string) => void;
  onAddTrackingLog: (slipId: string, log: Omit<TrackingLog, 'id' | 'timestamp' | 'operatorName'>) => void;
  onConfirmSupplement: (slipId: string) => void;
  onCloseSlip: (slipId: string) => void;
  onExceptionCloseSlip: (slipId: string, reason: string) => void;
}

export const SlipDetailModal: React.FC<SlipDetailModalProps> = ({
  slip,
  currentUser,
  onClose,
  onSubmitSlip,
  onReceiveSlip,
  onRejectSubmission,
  onAddTrackingLog,
  onConfirmSupplement,
  onCloseSlip,
  onExceptionCloseSlip,
}) => {
  if (!slip) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'tracking'>('info');
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [contactType, setContactType] = useState<'PHONE' | 'LINE' | 'IN_PERSON' | 'EMAIL'>('PHONE');
  const [contactTarget, setContactTarget] = useState(slip.responsiblePersonName);
  const [responseSummary, setResponseSummary] = useState('');
  const [promisedDate, setPromisedDate] = useState('');

  const [showExceptionCloseModal, setShowExceptionCloseModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const statusMeta = getStatusMeta(slip.status);
  const auditMeta = getAuditStatusMeta(slip.auditStatus);
  const overdueDays = calcOverdueDays(slip.expectedDueDate);

  const isAccountantOrSupervisor = currentUser.role === 'ACCOUNTANT' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';
  const isSupervisorOrAdmin = currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';
  const isOwner = currentUser.name.includes(slip.responsiblePersonName) || currentUser.code === slip.responsiblePersonId;

  const handleSaveTrackingLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseSummary.trim()) return;
    onAddTrackingLog(slip.id, {
      contactType,
      contactTarget,
      targetPhone: slip.responsiblePersonPhone,
      responseSummary,
      promisedDate: promisedDate || undefined,
    });
    setResponseSummary('');
    setShowAddLogModal(false);
  };

  const handleDoExceptionClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionReason.trim()) return;
    onExceptionCloseSlip(slip.id, exceptionReason);
    setShowExceptionCloseModal(false);
  };

  const handleDoReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim() || !onRejectSubmission) return;
    onRejectSubmission(slip.id, rejectReason);
    setShowRejectModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{slip.id}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
                {overdueDays > 0 && slip.status !== 'CLOSED' && slip.status !== 'EXCEPTION_CLOSED' && (
                  <span className="text-xs bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full border border-rose-700">
                    逾期 {overdueDays} 天
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">銷貨訂單編號: {slip.orderNo || '無'} ｜ 交易客戶: {slip.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            簽單詳細資料
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            操作稽核歷程 ({slip.historyLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'tracking'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            催單追蹤紀錄 ({slip.trackingLogs.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Alert message if anomaly */}
              {(slip.status === 'ANOMALY' || slip.auditStatus === 'AMOUNT_MISMATCH' || slip.auditStatus === 'MISSING_SLIP') && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start gap-3 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold">簽帳單異常警示</div>
                    <p className="text-rose-800">{slip.anomalyReason || '此單據尚未收件或金額比對不吻合，請盡速處理。'}</p>
                    {slip.auditStatus === 'AMOUNT_MISMATCH' && (
                      <div className="mt-2 bg-white/80 p-2 rounded-lg border border-rose-200 text-xs">
                        實簽金額: <span className="font-bold">{formatCurrency(slip.amount)}</span> ｜ 
                        帳務金額: <span className="font-bold">{formatCurrency(slip.accountingAmount)}</span> ｜ 
                        差異: <span className="font-bold text-rose-600">{formatCurrency((slip.accountingAmount || slip.amount) - slip.amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Building2Icon className="w-4 h-4 text-indigo-600" />
                    交易基本資訊
                  </h3>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">客戶名稱</span>
                    <span className="font-semibold text-slate-900">{slip.customerName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">交易日期</span>
                    <span className="font-medium text-slate-800">{slip.transactionDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">文件類型</span>
                    <span className="font-medium text-slate-800">{getDocumentTypeLabel(slip.documentType)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">實體簽帳金額</span>
                    <span className="font-bold text-indigo-700 text-sm">{formatCurrency(slip.amount)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    外勤負責人與繳交規定
                  </h3>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">負責人員</span>
                    <span className="font-semibold text-slate-900">
                      {slip.responsiblePersonName} ({slip.responsiblePersonId})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">崗位身分</span>
                    <span className="font-medium text-slate-800">{slip.responsiblePersonRole}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">預計繳交期限 (T+3)</span>
                    <span className="font-medium text-slate-800">{slip.expectedDueDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">逾期天數</span>
                    <span className={`font-bold ${overdueDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {overdueDays > 0 ? `已逾期 ${overdueDays} 天` : '未逾期 (正常)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Handover & Receipt Timeline */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  繳交與收件交接時程
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">負責人登記繳交時間:</span>
                    <div className="font-semibold text-slate-800 mt-1">
                      {slip.submissionDate ? `${slip.submissionDate} (繳交人: ${slip.submittedBy})` : '尚未登記繳交 (司機持有中)'}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">會計實體點收時間:</span>
                    <div className="font-semibold text-slate-800 mt-1">
                      {slip.receiptDate ? `${slip.receiptDate} (收件人: ${slip.receivedBy})` : '會計尚未收件確認 (紙本待點收)'}
                    </div>
                  </div>
                </div>
                {slip.receiptRemarks && (
                  <div className="text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                    <span className="font-semibold text-amber-900">收件備註：</span>{slip.receiptRemarks}
                  </div>
                )}
              </div>

              {/* Accounting Close Info */}
              {(slip.status === 'CLOSED' || slip.status === 'EXCEPTION_CLOSED') && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    結案資訊
                  </div>
                  <div className="text-emerald-800">
                    結案時間: {slip.closedAt} ｜ 結案人: {slip.closedBy}
                    {slip.supervisorApprovedBy && (
                      <span className="block mt-1 font-semibold text-purple-900">
                        特案核准主管: {slip.supervisorApprovedBy}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 flex justify-between items-center mb-2">
                <span>操作稽核軌跡 (依發生時間先後排序，嚴禁竄改)</span>
                <span className="font-semibold text-slate-700">共 {slip.historyLogs.length} 筆</span>
              </div>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {slip.historyLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                    <div className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 text-xs transition-colors">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{log.action}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mt-1">{log.details}</p>
                      <div className="text-[11px] text-indigo-700 font-medium mt-1">
                        操作人員: {log.operator} ({log.operatorRole})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">缺單催辦與追蹤紀錄</h4>
                  <p className="text-[11px] text-slate-500">記錄與外勤或客戶催單溝通的詳細承諾及回覆</p>
                </div>
                {isAccountantOrSupervisor && (
                  <button
                    onClick={() => setShowAddLogModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    新增催單歷程
                  </button>
                )}
              </div>

              {slip.trackingLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  尚無催單追蹤紀錄
                </div>
              ) : (
                <div className="space-y-3">
                  {slip.trackingLogs.map((log) => (
                    <div key={log.id} className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px]">
                            {log.contactType === 'PHONE' ? '電話聯絡' : log.contactType === 'LINE' ? 'LINE訊息' : log.contactType === 'EMAIL' ? '電子郵件' : '當面溝通'}
                          </span>
                          聯絡對象: {log.contactTarget}
                        </span>
                        <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-800 font-medium bg-white/80 p-2 rounded-lg border border-amber-100">
                        「{log.responseSummary}」
                      </p>
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          {log.promisedDate && (
                            <span className="text-indigo-700 font-semibold mr-3">
                              承諾補件日期: {log.promisedDate}
                            </span>
                          )}
                          <span>催單會計: {log.operatorName}</span>
                        </span>
                        {log.statusNote && <span className="text-amber-700 font-medium">{log.statusNote}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            目前操作身分: <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.roleTitle})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Delivery/Onsite Staff: Submit slip */}
            {slip.status === 'PENDING_SUBMISSION' && (isOwner || currentUser.role === 'ADMIN') && (
              <button
                onClick={() => onSubmitSlip(slip.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                登記繳交至會計
              </button>
            )}

            {/* Accountant: Receive slip (F02-03) */}
            {slip.status === 'SUBMITTED_PENDING_RECEIPT' && isAccountantOrSupervisor && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors"
                >
                  退回重繳
                </button>
                <button
                  onClick={() => onReceiveSlip(slip.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  會計確認收件點收 (F02-03)
                </button>
              </>
            )}

            {/* Missing Slip: Confirm Supplement (F05-06) */}
            {slip.auditStatus === 'MISSING_SLIP' && isAccountantOrSupervisor && (
              <button
                onClick={() => onConfirmSupplement(slip.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-lg transition-colors shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                收到補件確認收件 (F05-06)
              </button>
            )}

            {/* Accounting: Close slip if AUDITED (F04-06) */}
            {slip.status === 'AUDITED' && isAccountantOrSupervisor && (
              <button
                onClick={() => onCloseSlip(slip.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                完成月結正式結案 (F04-06)
              </button>
            )}

            {/* Supervisor Exception Close (F05-07) */}
            {slip.status === 'ANOMALY' && isSupervisorOrAdmin && (
              <button
                onClick={() => setShowExceptionCloseModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-lg transition-colors shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                主管特案異常結案 (F05-07)
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
      </div>

      {/* Add Tracking Log Sub-Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">記錄催單聯絡歷程 (F05-05)</h3>
              <button onClick={() => setShowAddLogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTrackingLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">聯絡方式</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PHONE', 'LINE', 'IN_PERSON', 'EMAIL'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setContactType(t)}
                      className={`py-1.5 text-center rounded-lg border font-medium ${
                        contactType === t
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {t === 'PHONE' ? '電話' : t === 'LINE' ? 'LINE' : t === 'IN_PERSON' ? '當面' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">聯絡對象</label>
                <input
                  type="text"
                  value={contactTarget}
                  onChange={(e) => setContactTarget(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">對方回覆內容及說明</label>
                <textarea
                  rows={3}
                  value={responseSummary}
                  onChange={(e) => setResponseSummary(e.target.value)}
                  placeholder="例：司機表示放在車庫手套箱，承諾週三晚間回所繳交..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">承諾補件日期</label>
                <input
                  type="date"
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  儲存歷程
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exception Close Sub-Modal (F05-07) */}
      {showExceptionCloseModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-rose-200">
            <div className="flex justify-between items-center border-b pb-2 text-rose-900">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                會計主管特案異常結案 (F05-07)
              </h3>
              <button onClick={() => setShowExceptionCloseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              ⚠️ 系統處理規則：無法補件時，須由主管填寫核准原因及核准人員簽署，嚴禁直接刪除帳務紀錄！
            </div>
            <form onSubmit={handleDoExceptionClose} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">主管特案核准原因與簽呈案號</label>
                <textarea
                  rows={3}
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="例：紙本泡水損毀，已檢附客戶總部驗收確認公文 (案號：FIN-202610-EX002) 及銀行全額電匯證明，核准特案結案..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowExceptionCloseModal(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold"
                >
                  確認特案結案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Sub-Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">退回繳交／更正收件狀態 (F02-05)</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDoReject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">退回原因 (操作稽核必填)</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="例：點收收件箱無此正本，或客戶簽名蓋章有嚴重塗改，退回請外勤查明..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium"
                >
                  確認退回重繳
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
