import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  Eye, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  FileText,
  User,
  ArrowUpDown
} from 'lucide-react';
import { ChargeSlip, AppUser, ReceiptStatus, DocumentType } from '../types';
import { formatCurrency, getDocumentTypeLabel, getStatusMeta, getAuditStatusMeta, calcOverdueDays } from '../utils/formatters';
import { exportSlipsToCsv } from '../utils/csv';

interface SlipListTabProps {
  slips: ChargeSlip[];
  currentUser: AppUser;
  onOpenNewSlip: () => void;
  onOpenImport: () => void;
  onSelectSlip: (slip: ChargeSlip) => void;
  onSubmitSlip: (slipId: string) => void;
  onReceiveSlip: (slipId: string) => void;
}

export const SlipListTab: React.FC<SlipListTabProps> = ({
  slips,
  currentUser,
  onOpenNewSlip,
  onOpenImport,
  onSelectSlip,
  onSubmitSlip,
  onReceiveSlip,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('ALL');
  const [dateFilterType, setDateFilterType] = useState<'transaction' | 'expected'>('transaction');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Extract unique responsible persons for filter
  const responsiblePersons = useMemo(() => {
    const map = new Map<string, string>();
    slips.forEach(s => map.set(s.responsiblePersonName, s.responsiblePersonRole));
    return Array.from(map.entries());
  }, [slips]);

  // Filtered slips
  const filteredSlips = useMemo(() => {
    return slips.filter((slip) => {
      // Keyword search (F03-01)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = slip.id.toLowerCase().includes(query);
        const matchesOrder = slip.orderNo?.toLowerCase().includes(query);
        const matchesCustomer = slip.customerName.toLowerCase().includes(query);
        const matchesPerson = slip.responsiblePersonName.toLowerCase().includes(query);
        if (!matchesId && !matchesOrder && !matchesCustomer && !matchesPerson) {
          return false;
        }
      }

      // Status filter (F03-03)
      if (statusFilter !== 'ALL' && slip.status !== statusFilter) {
        return false;
      }

      // Doc Type filter
      if (docTypeFilter !== 'ALL' && slip.documentType !== docTypeFilter) {
        return false;
      }

      // Responsible person filter
      if (responsibleFilter !== 'ALL' && slip.responsiblePersonName !== responsibleFilter) {
        return false;
      }

      // Date range filter (F03-02)
      const targetDate = dateFilterType === 'transaction' ? slip.transactionDate : slip.expectedDueDate;
      if (dateFrom && targetDate < dateFrom) return false;
      if (dateTo && targetDate > dateTo) return false;

      return true;
    });
  }, [slips, searchTerm, statusFilter, docTypeFilter, responsibleFilter, dateFilterType, dateFrom, dateTo]);

  const handleExport = () => {
    exportSlipsToCsv(filteredSlips, `簽帳單查詢匯出_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const isAccountant = currentUser.role === 'ACCOUNTANT' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋簽帳單編號、銷貨單號、客戶名稱或外勤人員 (F03-01)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                清除
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-xs transition-colors"
              title="匯出目前篩選結果為 CSV (F03-05)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>匯出 CSV</span>
            </button>

            {isAccountant && (
              <button
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-xs transition-colors"
                title="批次匯入簽帳單 (F01-05)"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>匯入 CSV</span>
              </button>
            )}

            <button
              onClick={onOpenNewSlip}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新增簽帳單 (F01-01)</span>
            </button>
          </div>
        </div>

        {/* Detailed Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">狀態篩選:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-hidden"
            >
              <option value="ALL">全部狀態 (不拘)</option>
              <option value="PENDING_SUBMISSION">待繳交 (外勤持有)</option>
              <option value="SUBMITTED_PENDING_RECEIPT">已繳交／待收件確認</option>
              <option value="RECEIVED_PENDING_AUDIT">已收件／待核對</option>
              <option value="AUDITING">核對中</option>
              <option value="ANOMALY">異常追蹤 (缺單/金額不符)</option>
              <option value="AUDITED">核對完成</option>
              <option value="CLOSED">已結案</option>
              <option value="EXCEPTION_CLOSED">特案異常結案</option>
            </select>
          </div>

          {/* Document Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">單據類型:</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-hidden"
            >
              <option value="ALL">全部單據類型</option>
              <option value="DELIVERY_SLIP">送貨簽帳單</option>
              <option value="ONSITE_SLIP">現場簽帳單</option>
              <option value="SPECIAL_ORDER">專案簽帳單</option>
              <option value="REPAIR_SERVICE">維修服務簽收單</option>
            </select>
          </div>

          {/* Responsible Person Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 shrink-0">負責人員:</span>
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs focus:outline-hidden"
            >
              <option value="ALL">全部外勤人員</option>
              {responsiblePersons.map(([name, role]) => (
                <option key={name} value={name}>
                  {name} ({role})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 text-xs shrink-0"
            >
              <option value="transaction">交易日</option>
              <option value="expected">到期日</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Slips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-600 font-medium">
            符合條件清單：共 <strong className="text-slate-900 font-bold">{filteredSlips.length}</strong> 筆
            {filteredSlips.length !== slips.length && (
              <span className="text-slate-400 ml-1">(全部共 {slips.length} 筆)</span>
            )}
          </div>
          <div className="text-slate-500 hidden sm:block">
            點擊「檢視」可查閱完整交易、點收交接時程與稽核歷程
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3">簽帳單編號</th>
                <th className="py-3 px-3">客戶名稱 / 訂單號</th>
                <th className="py-3 px-3">交易日期</th>
                <th className="py-3 px-3 text-right">實體簽帳金額</th>
                <th className="py-3 px-3">負責人 (外勤)</th>
                <th className="py-3 px-3">繳交期限 (T+3)</th>
                <th className="py-3 px-3 text-center">單據狀態</th>
                <th className="py-3 px-3 text-center">帳務核對</th>
                <th className="py-3 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    無符合條件的簽帳單資料
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => {
                  const statusMeta = getStatusMeta(slip.status);
                  const auditMeta = getAuditStatusMeta(slip.auditStatus);
                  const overdueDays = calcOverdueDays(slip.expectedDueDate);
                  const isOwner = currentUser.name.includes(slip.responsiblePersonName) || currentUser.code === slip.responsiblePersonId;

                  return (
                    <tr
                      key={slip.id}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      {/* Slip ID */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <button
                          onClick={() => onSelectSlip(slip)}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                        >
                          <span>{slip.id}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 block font-sans font-normal">
                          {getDocumentTypeLabel(slip.documentType)}
                        </span>
                      </td>

                      {/* Customer & Order */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                          {slip.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {slip.orderNo || '無銷貨單號'}
                        </div>
                      </td>

                      {/* Transaction Date */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {slip.transactionDate}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          {formatCurrency(slip.amount)}
                        </div>
                        {slip.accountingAmount && slip.accountingAmount !== slip.amount && (
                          <span className="text-[10px] text-rose-600 block">
                            帳面 {formatCurrency(slip.accountingAmount)}
                          </span>
                        )}
                      </td>

                      {/* Responsible Person */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{slip.responsiblePersonName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {slip.responsiblePersonRole} ({slip.responsiblePersonId})
                        </span>
                      </td>

                      {/* Due Date & Overdue */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-700">{slip.expectedDueDate}</div>
                        {overdueDays > 0 && slip.status !== 'CLOSED' && slip.status !== 'EXCEPTION_CLOSED' ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            已逾期 {overdueDays} 天
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">正常期限</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${statusMeta.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.bgClass}`}></span>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Audit Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] border ${auditMeta.class}`}>
                          {auditMeta.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSlip(slip)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="查看明細與歷程 (F03-04)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick delivery action */}
                          {slip.status === 'PENDING_SUBMISSION' && (isOwner || currentUser.role === 'ADMIN') && (
                            <button
                              onClick={() => onSubmitSlip(slip.id)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-[11px] font-semibold transition-colors"
                              title="登記繳交"
                            >
                              登記繳交
                            </button>
                          )}

                          {/* Quick receive action */}
                          {slip.status === 'SUBMITTED_PENDING_RECEIPT' && isAccountant && (
                            <button
                              onClick={() => onReceiveSlip(slip.id)}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-md text-[11px] font-semibold transition-colors"
                              title="會計點收確認 (F02-03)"
                            >
                              點收確認
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
