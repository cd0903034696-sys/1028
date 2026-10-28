import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  Clock, 
  PieChart, 
  FileText,
  Building
} from 'lucide-react';
import { ChargeSlip, AppUser } from '../types';
import { formatCurrency, calcOverdueDays, getStatusMeta } from '../utils/formatters';
import { exportSlipsToCsv } from '../utils/csv';

interface ReportsTabProps {
  slips: ChargeSlip[];
  currentUser: AppUser;
  onSelectSlip: (slip: ChargeSlip) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  slips,
  currentUser,
  onSelectSlip,
}) => {
  const [activeReportSubTab, setActiveReportSubTab] = useState<'overview' | 'personnel' | 'monthEnd' | 'overdue'>('overview');

  // Overall Statistics
  const totalSlipsCount = slips.length;
  const receivedSlipsCount = slips.filter(s => !!s.receiptDate).length;
  const closedSlipsCount = slips.filter(s => s.status === 'CLOSED' || s.status === 'EXCEPTION_CLOSED').length;
  const auditedCount = slips.filter(s => s.status === 'AUDITED').length;
  const missingCount = slips.filter(s => s.status === 'ANOMALY' || s.auditStatus === 'MISSING_SLIP').length;
  const mismatchCount = slips.filter(s => s.auditStatus === 'AMOUNT_MISMATCH').length;
  const overdueSlips = slips.filter(s => calcOverdueDays(s.expectedDueDate) > 0 && s.status !== 'CLOSED' && s.status !== 'EXCEPTION_CLOSED');

  const totalAmount = slips.reduce((sum, s) => sum + (s.accountingAmount || s.amount), 0);
  const receivedAmount = slips.filter(s => !!s.receiptDate).reduce((sum, s) => sum + s.amount, 0);
  const closedAmount = slips.filter(s => s.status === 'CLOSED' || s.status === 'EXCEPTION_CLOSED').reduce((sum, s) => sum + s.amount, 0);

  const receiptRate = totalSlipsCount > 0 ? Math.round((receivedSlipsCount / totalSlipsCount) * 100) : 0;
  const monthEndCloseRate = totalSlipsCount > 0 ? Math.round(((closedSlipsCount + auditedCount) / totalSlipsCount) * 100) : 0;

  // Personnel Handover Statistics (F06 人員繳交統計)
  const personnelStats = React.useMemo(() => {
    const statsMap = new Map<string, {
      name: string;
      role: string;
      totalAssigned: number;
      submittedOnTime: number;
      overdueCount: number;
      missingCount: number;
      totalAmount: number;
      receivedCount: number;
    }>();

    slips.forEach(slip => {
      const key = slip.responsiblePersonName;
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          name: key,
          role: slip.responsiblePersonRole,
          totalAssigned: 0,
          submittedOnTime: 0,
          overdueCount: 0,
          missingCount: 0,
          totalAmount: 0,
          receivedCount: 0,
        });
      }
      const record = statsMap.get(key)!;
      record.totalAssigned += 1;
      record.totalAmount += slip.amount;

      const overdueDays = calcOverdueDays(slip.expectedDueDate);
      if (slip.receiptDate) {
        record.receivedCount += 1;
        if (overdueDays === 0) {
          record.submittedOnTime += 1;
        } else {
          record.overdueCount += 1;
        }
      } else {
        if (overdueDays > 0) {
          record.overdueCount += 1;
          record.missingCount += 1;
        }
      }
    });

    return Array.from(statsMap.values());
  }, [slips]);

  // Export Month-End Close Report
  const handleExportMonthEndReport = () => {
    exportSlipsToCsv(slips, `2026年10月_會計月結簽帳單檢核報表_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                管理統計與月結報表中心 (F06)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              即時統計簽帳單總數、實收件數、逾期排行、人員繳交準時率與月底關帳進度
            </p>
          </div>

          <button
            onClick={handleExportMonthEndReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            匯出本月月結分析報表 (CSV)
          </button>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex border-b border-slate-200 mt-5 text-xs font-semibold">
          <button
            onClick={() => setActiveReportSubTab('overview')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeReportSubTab === 'overview'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            簽帳單總覽與核對進度
          </button>
          <button
            onClick={() => setActiveReportSubTab('personnel')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeReportSubTab === 'personnel'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            外勤人員繳交績效統計 ({personnelStats.length} 人)
          </button>
          <button
            onClick={() => setActiveReportSubTab('overdue')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeReportSubTab === 'overdue'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            逾期未繳排行榜 ({overdueSlips.length} 筆)
          </button>
          <button
            onClick={() => setActiveReportSubTab('monthEnd')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeReportSubTab === 'monthEnd'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            月結清單與未結異常原因彙整
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Overview & Progress */}
      {activeReportSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">指定期間應收總單數</span>
              <div className="text-2xl font-bold text-slate-900">{totalSlipsCount} 筆</div>
              <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>帳務總額</span>
                <span className="font-semibold text-slate-800">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">實體驗收收件率</span>
              <div className="text-2xl font-bold text-blue-700">{receiptRate}%</div>
              <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>已點收 / 應收</span>
                <span className="font-semibold text-blue-800">{receivedSlipsCount} / {totalSlipsCount} 筆</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">月結完成率 (結案+核可)</span>
              <div className="text-2xl font-bold text-emerald-700">{monthEndCloseRate}%</div>
              <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>已完成項目</span>
                <span className="font-semibold text-emerald-800">{closedSlipsCount + auditedCount} 筆</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium">異常列管中 (缺單/金額)</span>
              <div className="text-2xl font-bold text-rose-700">{missingCount + mismatchCount} 筆</div>
              <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>金額不符: {mismatchCount} 筆</span>
                <span className="font-semibold text-rose-700">缺單: {missingCount} 筆</span>
              </div>
            </div>
          </div>

          {/* Progress Bars Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              簽帳單生命週期狀態分布
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>已結案／特案結案 (歸檔完成)</span>
                  <span className="font-bold text-emerald-700">{closedSlipsCount} 筆 ({Math.round((closedSlipsCount/totalSlipsCount)*100 || 0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${(closedSlipsCount/totalSlipsCount)*100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>核對完成 (待批次月結)</span>
                  <span className="font-bold text-teal-700">{auditedCount} 筆 ({Math.round((auditedCount/totalSlipsCount)*100 || 0)}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${(auditedCount/totalSlipsCount)*100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>已收件／待核對 (會計桌上待比對)</span>
                  <span className="font-bold text-indigo-700">{slips.filter(s => s.status === 'RECEIVED_PENDING_AUDIT').length} 筆</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(slips.filter(s => s.status === 'RECEIVED_PENDING_AUDIT').length/totalSlipsCount)*100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>已繳交／待收件確認 (外勤已交，會計尚未點收)</span>
                  <span className="font-bold text-blue-700">{slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT').length} 筆</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT').length/totalSlipsCount)*100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>異常追蹤與缺單 (需催辦調解)</span>
                  <span className="font-bold text-rose-700">{missingCount + mismatchCount} 筆</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${((missingCount + mismatchCount)/totalSlipsCount)*100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Personnel Performance */}
      {activeReportSubTab === 'personnel' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              各外勤人員應繳交與準時率統計 (F06 人員繳交統計)
            </span>
            <span className="text-slate-500">外勤人員準時繳回是月底順利結算的關鍵 KPI</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-3">外勤人員姓名</th>
                  <th className="py-3 px-3">單位崗位</th>
                  <th className="py-3 px-3 text-center">總分配簽單數</th>
                  <th className="py-3 px-3 text-right">經手總金額</th>
                  <th className="py-3 px-3 text-center">已收件數</th>
                  <th className="py-3 px-3 text-center">準時繳交數</th>
                  <th className="py-3 px-3 text-center">逾期 / 缺單數</th>
                  <th className="py-3 px-3 text-center">準時繳回率 (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personnelStats.map((person) => {
                  const onTimeRate = person.totalAssigned > 0
                    ? Math.round((person.submittedOnTime / person.totalAssigned) * 100)
                    : 100;

                  return (
                    <tr key={person.name} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">{person.name}</td>
                      <td className="py-3 px-3 text-slate-600">{person.role}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {person.totalAssigned} 筆
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(person.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-center text-blue-700 font-semibold">
                        {person.receivedCount} 筆
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                        {person.submittedOnTime} 筆
                      </td>
                      <td className="py-3 px-3 text-center">
                        {person.overdueCount > 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {person.overdueCount} 筆
                          </span>
                        ) : (
                          <span className="text-slate-400">0 筆</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-bold ${onTimeRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {onTimeRate}%
                          </span>
                          <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${onTimeRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${onTimeRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Overdue Ranking */}
      {activeReportSubTab === 'overdue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              超過繳交期限之簽帳單排行 (F06 逾期報表)
            </span>
            <span className="text-slate-500">依逾期天數由長至短排序</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-3">簽帳單編號</th>
                  <th className="py-3 px-3">客戶名稱</th>
                  <th className="py-3 px-3 text-right">簽帳金額</th>
                  <th className="py-3 px-3">負責外勤</th>
                  <th className="py-3 px-3">預計繳交日</th>
                  <th className="py-3 px-3 text-center">逾期天數</th>
                  <th className="py-3 px-3 text-center">目前狀態</th>
                  <th className="py-3 px-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueSlips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      目前無任何逾期簽帳單！外勤繳單狀況良好。
                    </td>
                  </tr>
                ) : (
                  overdueSlips.map((slip) => {
                    const days = calcOverdueDays(slip.expectedDueDate);
                    const statusMeta = getStatusMeta(slip.status);

                    return (
                      <tr key={slip.id} className="hover:bg-rose-50/20">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{slip.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{slip.customerName}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(slip.amount)}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {slip.responsiblePersonName} ({slip.responsiblePersonRole})
                        </td>
                        <td className="py-3 px-3 text-slate-600">{slip.expectedDueDate}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                            逾期 {days} 天
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onSelectSlip(slip)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            查閱歷程
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Month-End Close Checklist */}
      {activeReportSubTab === 'monthEnd' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2026年10月份 會計月結查核清單與阻礙項目 (F06 月結報表)
              </h3>
              <p className="text-slate-500 mt-0.5">
                月底月結標準：所有銷貨單據必須「實體點收無誤」且「金額比對吻合」，方能正式月結關帳
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              monthEndCloseRate === 100 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              目前月結進度: {monthEndCloseRate}%
            </span>
          </div>

          {/* Pending Action Items blocking close */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800">未結案件與阻礙原因檢核：</h4>
            {slips.filter(s => s.status !== 'CLOSED' && s.status !== 'EXCEPTION_CLOSED').map(slip => (
              <div
                key={slip.id}
                onClick={() => onSelectSlip(slip)}
                className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{slip.id}</span>
                    <span className="font-semibold text-slate-800">{slip.customerName}</span>
                    <span className="text-slate-500">({formatCurrency(slip.amount)})</span>
                  </div>
                  <div className="text-[11px] text-rose-700 font-medium">
                    阻礙原因: {slip.anomalyReason || (slip.receiptDate ? '尚未執行核對或結案' : '尚未收件')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-indigo-600 font-semibold hover:underline">
                    點擊處理 →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
