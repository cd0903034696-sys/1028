import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileCheck2, 
  ArrowRight, 
  FileSearch, 
  DollarSign, 
  Check, 
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ChargeSlip, ErpBillingRecord, AppUser } from '../types';
import { formatCurrency, getAuditStatusMeta, getStatusMeta } from '../utils/formatters';

interface ReconciliationTabProps {
  slips: ChargeSlip[];
  erpRecords: ErpBillingRecord[];
  currentUser: AppUser;
  onRunAutoReconciliation: () => void;
  onResolveAnomaly: (slipId: string, resolutionNote: string, adjustAccountingAmount?: number) => void;
  onCloseSlip: (slipId: string) => void;
  onSelectSlip: (slip: ChargeSlip) => void;
  onBatchCloseAudited: () => void;
}

export const ReconciliationTab: React.FC<ReconciliationTabProps> = ({
  slips,
  erpRecords,
  currentUser,
  onRunAutoReconciliation,
  onResolveAnomaly,
  onCloseSlip,
  onSelectSlip,
  onBatchCloseAudited,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'ANOMALY' | 'MATCHED' | 'UNAUDITED'>('ALL');
  const [resolvingSlip, setResolvingSlip] = useState<ChargeSlip | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number | ''>('');

  const isAccountant = currentUser.role === 'ACCOUNTANT' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';

  // Audit Statistics
  const matchedSlips = slips.filter(s => s.auditStatus === 'MATCHED');
  const mismatchSlips = slips.filter(s => s.auditStatus === 'AMOUNT_MISMATCH');
  const missingSlips = slips.filter(s => s.auditStatus === 'MISSING_SLIP');
  const auditedReadyToClose = slips.filter(s => s.status === 'AUDITED');
  const alreadyClosed = slips.filter(s => s.status === 'CLOSED' || s.status === 'EXCEPTION_CLOSED');

  // Filter display list
  const displaySlips = slips.filter(slip => {
    if (filterMode === 'ANOMALY') {
      return slip.status === 'ANOMALY' || slip.auditStatus === 'AMOUNT_MISMATCH' || slip.auditStatus === 'MISSING_SLIP';
    }
    if (filterMode === 'MATCHED') {
      return slip.auditStatus === 'MATCHED';
    }
    if (filterMode === 'UNAUDITED') {
      return slip.status !== 'AUDITED' && slip.status !== 'CLOSED' && slip.status !== 'EXCEPTION_CLOSED';
    }
    return true;
  });

  const handleOpenResolve = (slip: ChargeSlip) => {
    setResolvingSlip(slip);
    setResolutionText(slip.auditNote || slip.anomalyReason || '');
    setAdjustAmount(slip.amount);
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingSlip) return;
    onResolveAnomaly(
      resolvingSlip.id,
      resolutionText,
      adjustAmount !== '' ? Number(adjustAmount) : undefined
    );
    setResolvingSlip(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Auto Run Reconciliation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                帳務核對工作台 (F04 比對預期清單與實體收件)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              勾稽 ERP 銷貨帳務資料與外勤實體簽收單據，自動標示缺單、金額不符並支援人工異常調解
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onRunAutoReconciliation}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              title="執行 ERP 帳目與簽帳單自動交叉比對 (F04-02 & F04-03)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              執行兩方自動比對勾稽
            </button>

            {isAccountant && (
              <button
                onClick={onBatchCloseAudited}
                disabled={auditedReadyToClose.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                title="所有必要項目核對無誤後批次結案 (F04-06 & AT-10)"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                批次月結結案 ({auditedReadyToClose.length})
              </button>
            )}
          </div>
        </div>

        {/* Audit Metric Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div 
            onClick={() => setFilterMode('MATCHED')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'MATCHED' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <span className="text-slate-500 block">帳實相符 (已吻合)</span>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              {matchedSlips.length} <span className="text-xs font-normal text-slate-500">筆</span>
            </div>
          </div>

          <div 
            onClick={() => setFilterMode('ANOMALY')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'ANOMALY' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <span className="text-slate-500 block">金額不符異常 (AT-05)</span>
            <div className="text-lg font-bold text-rose-700 mt-1 flex items-center gap-1">
              {mismatchSlips.length} <span className="text-xs font-normal text-slate-500">筆</span>
              {mismatchSlips.length > 0 && <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded font-bold">待確認</span>}
            </div>
          </div>

          <div 
            onClick={() => setFilterMode('ANOMALY')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'ANOMALY' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <span className="text-slate-500 block">缺單未收件 (AT-04)</span>
            <div className="text-lg font-bold text-orange-700 mt-1">
              {missingSlips.length} <span className="text-xs font-normal text-slate-500">筆</span>
            </div>
          </div>

          <div 
            onClick={() => setFilterMode('ALL')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              filterMode === 'ALL' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <span className="text-slate-500 block">完成月結正式結案</span>
            <div className="text-lg font-bold text-indigo-700 mt-1">
              {alreadyClosed.length} <span className="text-xs font-normal text-slate-500">筆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              比對明細清單 ({displaySlips.length} 筆)
            </span>
            <span className="text-slate-400">｜</span>
            <span className="text-slate-500">
              顯示模式: {filterMode === 'ALL' ? '全部單據' : filterMode === 'ANOMALY' ? '僅看異常待查' : filterMode === 'MATCHED' ? '僅看吻合項目' : '未結案項目'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'ANOMALY', 'MATCHED', 'UNAUDITED'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode === 'ALL' ? '全部' : mode === 'ANOMALY' ? '僅異常' : mode === 'MATCHED' ? '已吻合' : '待結案'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3">簽帳單號 / ERP單號</th>
                <th className="py-3 px-3">客戶名稱</th>
                <th className="py-3 px-3 text-right">實體簽單金額</th>
                <th className="py-3 px-3 text-right">ERP帳面金額</th>
                <th className="py-3 px-3 text-right">核對差額</th>
                <th className="py-3 px-3 text-center">實體收件狀態</th>
                <th className="py-3 px-3 text-center">核對結果 (F04-04)</th>
                <th className="py-3 px-3">異常說明 / 核對備註</th>
                <th className="py-3 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displaySlips.map((slip) => {
                const diff = (slip.accountingAmount || slip.amount) - slip.amount;
                const isMismatch = slip.auditStatus === 'AMOUNT_MISMATCH';
                const isMissing = slip.auditStatus === 'MISSING_SLIP';
                const isMatched = slip.auditStatus === 'MATCHED';
                const isAudited = slip.status === 'AUDITED';
                const isClosed = slip.status === 'CLOSED' || slip.status === 'EXCEPTION_CLOSED';
                const auditMeta = getAuditStatusMeta(slip.auditStatus);
                const statusMeta = getStatusMeta(slip.status);

                return (
                  <tr
                    key={slip.id}
                    className={`transition-colors ${
                      isMismatch
                        ? 'bg-rose-50/40 hover:bg-rose-50'
                        : isMissing
                        ? 'bg-orange-50/30 hover:bg-orange-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* ID */}
                    <td className="py-3 px-3 font-mono">
                      <button
                        onClick={() => onSelectSlip(slip)}
                        className="font-bold text-slate-900 hover:text-indigo-600 hover:underline block"
                      >
                        {slip.id}
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {slip.orderNo || '-'}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                        {slip.customerName}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        外勤: {slip.responsiblePersonName} ({slip.responsiblePersonRole})
                      </span>
                    </td>

                    {/* Physical Slip Amount */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(slip.amount)}
                    </td>

                    {/* ERP Accounting Amount */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                      {formatCurrency(slip.accountingAmount || slip.amount)}
                    </td>

                    {/* Diff */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold">
                      {diff === 0 ? (
                        <span className="text-emerald-600 font-semibold">$0 (吻合)</span>
                      ) : (
                        <span className="text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded">
                          {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                        </span>
                      )}
                    </td>

                    {/* Physical Receipt State */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {slip.receiptDate ? (
                        <span className="text-emerald-700 font-medium inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          已點收 ({slip.receivedBy})
                        </span>
                      ) : slip.submissionDate ? (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          已繳待收件
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          尚未繳回
                        </span>
                      )}
                    </td>

                    {/* Audit Status Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${auditMeta.class}`}>
                        {auditMeta.label}
                      </span>
                    </td>

                    {/* Remarks / Reason */}
                    <td className="py-3 px-3 text-slate-600 max-w-[220px]">
                      {slip.anomalyReason ? (
                        <div className="text-rose-700 font-medium text-[11px] line-clamp-2 bg-rose-50/80 p-1 rounded border border-rose-200">
                          ⚠️ {slip.anomalyReason}
                        </div>
                      ) : slip.auditNote ? (
                        <span className="text-[11px] text-slate-700 line-clamp-2">
                          {slip.auditNote}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">比對無備註</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Resolve Anomaly button (F04-05) */}
                        {isAccountant && (isMismatch || isMissing) && (
                          <button
                            onClick={() => handleOpenResolve(slip)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors"
                            title="填寫異常原因與調解記錄 (F04-05)"
                          >
                            人工調解確認
                          </button>
                        )}

                        {/* Close button if AUDITED (F04-06) */}
                        {isAccountant && isAudited && (
                          <button
                            onClick={() => onCloseSlip(slip.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-xs transition-colors"
                            title="執行單筆結案 (F04-06)"
                          >
                            結案歸檔
                          </button>
                        )}

                        {isClosed && (
                          <span className="text-slate-400 text-[11px] font-semibold">
                            已結案
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Anomaly Resolution Modal (F04-05 人工確認) */}
      {resolvingSlip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  帳務異常人工調解確認 (F04-05)
                </h3>
                <p className="text-xs text-slate-500">
                  簽帳單編號: {resolvingSlip.id} ｜ 客戶: {resolvingSlip.customerName}
                </p>
              </div>
              <button onClick={() => setResolvingSlip(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">實體簽帳金額:</span>
                <span className="font-bold text-slate-900">{formatCurrency(resolvingSlip.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">原 ERP 帳面金額:</span>
                <span className="font-bold text-slate-900">{formatCurrency(resolvingSlip.accountingAmount)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>差異金額:</span>
                <span>{formatCurrency((resolvingSlip.accountingAmount || resolvingSlip.amount) - resolvingSlip.amount)}</span>
              </div>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  會計調整確認後金額 (NTD)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  placeholder="調整後的核銷金額"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  若經開立折讓單或補單，請設定最終核銷金額 (如扣除折讓後以實簽金額立帳)
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  異常處理原因與核准備註 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="例：客戶現場扣除受潮耗材折讓 $7,000，業務已補開銷貨折讓單 (單號: CN-202610-09)，經查核無訛，核定以 $45,000 結案..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setResolvingSlip(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  確認調解並標記為核對完成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
