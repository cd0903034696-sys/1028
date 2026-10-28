import React from 'react';
import { 
  Truck, 
  MapPin, 
  User, 
  ArrowRight, 
  Inbox, 
  FileCheck2, 
  Scale, 
  AlertTriangle, 
  ShieldCheck, 
  PhoneCall, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  Building,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { ChargeSlip, AppUser } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RoleWorkflowDiagramProps {
  slips: ChargeSlip[];
  currentUser: AppUser;
  onNavigateTab: (tab: 'list' | 'handover' | 'reconciliation' | 'missing' | 'reports') => void;
  onSelectUserFilter?: (userName: string) => void;
}

export const RoleWorkflowDiagram: React.FC<RoleWorkflowDiagramProps> = ({
  slips,
  currentUser,
  onNavigateTab,
}) => {
  // Real-time counts at each stage/person
  const pendingSubmissionSlips = slips.filter(s => s.status === 'PENDING_SUBMISSION');
  const submittedWaitingReceiptSlips = slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT');
  const receivedWaitingAuditSlips = slips.filter(s => s.status === 'RECEIVED_PENDING_AUDIT');
  const anomalySlips = slips.filter(s => s.status === 'ANOMALY' || s.auditStatus === 'AMOUNT_MISMATCH' || s.auditStatus === 'MISSING_SLIP');
  const auditedSlips = slips.filter(s => s.status === 'AUDITED');
  const closedSlips = slips.filter(s => s.status === 'CLOSED' || s.status === 'EXCEPTION_CLOSED');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Title & Legend Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>簽帳單全流程與作業人員「位置泳道圖」</span>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  責任到人 • 位置可視化
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                清楚標註每一環節由<strong>誰負責</strong>、處於<strong>何處實體位置</strong>、以及<strong>當前手頭卡件數量</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>外勤送貨／現場</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>會計人員</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>業務專員</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>會計主管</span>
          </div>
        </div>
      </div>

      {/* 5-Stage Interactive Workflow with People & Physical Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
        {/* Step 1: 送貨人員 / 現場作業員 */}
        <div 
          onClick={() => onNavigateTab('handover')}
          className="bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 p-3.5 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
        >
          <div className="space-y-3">
            {/* Step Number & Category */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                階段 01 • 出貨簽收
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-blue-600">
                點擊前往 →
              </span>
            </div>

            {/* PERSON BADGE (Highlighted) */}
            <div className="bg-white p-2.5 rounded-xl border border-blue-200 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  王
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    <span>王大明 / 李志強</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">送貨司機 (DLV-01/02)</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700">實體位置：</span>
                <span className="text-slate-600">外勤貨車上 / 配送途中</span>
              </div>
            </div>

            {/* Another Person in this stage: Site Operator */}
            <div className="bg-white/80 p-2 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                <div className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center font-bold">
                  張
                </div>
                <span>張建國 (現場作業 OPS-01)</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                <span>桃園倉儲自提處 / 維修現場</span>
              </div>
            </div>

            {/* Action Description */}
            <p className="text-[11px] text-slate-600 leading-relaxed">
              交貨客戶點收完成，取得實體簽名或印章，並於外勤系統<strong>登記已取得單據</strong>。
            </p>
          </div>

          {/* Current Live Workload */}
          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">外勤手頭待繳：</span>
            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {pendingSubmissionSlips.length} 筆
            </span>
          </div>
        </div>

        {/* Step 2: 實體投遞槽交接 (已繳交 != 已收件) */}
        <div 
          onClick={() => onNavigateTab('handover')}
          className="bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-300 p-3.5 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md relative overflow-hidden"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                階段 02 • 投單交接
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600">
                點擊前往 →
              </span>
            </div>

            {/* PERSON & LOCATION (The Handover Buffer) */}
            <div className="bg-white p-2.5 rounded-xl border border-amber-300 shadow-xs space-y-1.5">
              <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <Inbox className="w-3.5 h-3.5 text-amber-600" />
                <span>交接緩衝：司機投遞 ➔ 會計點收</span>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1 border-t border-amber-100">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700">實體位置：</span>
                <span className="font-bold text-amber-900">總管理處會計文件投遞槽</span>
              </div>
            </div>

            {/* CRITICAL GOLDEN RULE WARNING */}
            <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 text-[10px] text-amber-800 leading-tight">
              <strong>⚠️ 稽核防線：</strong>「已繳交」≠「已收件」！司機投入收件箱後，<strong>在會計開箱蓋章前不得視為已收件</strong>。
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              外勤人員回廠將紙本投入收件箱，系統狀態更新為「已繳交／待收件確認」。
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">待會計開箱收件：</span>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
              {submittedWaitingReceiptSlips.length} 筆
            </span>
          </div>
        </div>

        {/* Step 3: 會計人員實體驗收點收 */}
        <div 
          onClick={() => onNavigateTab('handover')}
          className="bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 hover:border-emerald-300 p-3.5 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                階段 03 • 實體驗收
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-emerald-600">
                點擊前往 →
              </span>
            </div>

            {/* PERSON BADGE (Accounting Staff) */}
            <div className="bg-white p-2.5 rounded-xl border border-emerald-300 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  陳
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    陳淑芬 (ACC-01)
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">總帳會計人員</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700">實體位置：</span>
                <span className="text-slate-600">財務會計部 • 單據點收審核桌</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              會計開箱點收、檢核印章、條碼刷件蓋收訖章，狀態變更為<strong>「已收件／待核對」</strong>；若單據有瑕疵退回重繳。
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">桌上已收待比對：</span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {receivedWaitingAuditSlips.length} 筆
            </span>
          </div>
        </div>

        {/* Step 4: 帳務勾稽與異常追查 (會計 + 業務 + 司機催單) */}
        <div 
          onClick={() => onNavigateTab(anomalySlips.length > 0 ? 'missing' : 'reconciliation')}
          className="bg-slate-50 hover:bg-rose-50/50 rounded-xl border border-slate-200 hover:border-rose-300 p-3.5 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                階段 04 • 勾稽與追查
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-rose-600">
                點擊前往 →
              </span>
            </div>

            {/* KEY PERSONNEL (Accounting + Sales + Delivery follow-up) */}
            <div className="bg-white p-2.5 rounded-xl border border-rose-300 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  林
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    林美玲 (SLS-01) ＆ 會計
                  </div>
                  <span className="text-[10px] text-purple-700 font-medium">企業業務 • 協查折讓扣款</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700">實體位置：</span>
                <span className="text-slate-600">業務辦公區 / 催單電話線路</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              會計與 ERP 比對金額，標示<strong>缺單未收</strong>與<strong>金額不符</strong>；聯絡業務開立折讓單或向外勤發出 LINE 催單。
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">異常/缺單追蹤中：</span>
            <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              {anomalySlips.length} 筆
            </span>
          </div>
        </div>

        {/* Step 5: 會計主管簽核與月結關帳 */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 hover:border-emerald-300 p-3.5 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                階段 05 • 審核結案
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-teal-600">
                點擊前往 →
              </span>
            </div>

            {/* PERSON BADGE (Supervisor) */}
            <div className="bg-white p-2.5 rounded-xl border border-teal-300 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                  許
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    許主任 (MGR-01)
                  </div>
                  <span className="text-[10px] text-rose-700 font-medium">財務會計部經理</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-700">實體位置：</span>
                <span className="text-slate-600">財務部經理辦公室 / 憑證庫</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              單據全部到齊、帳實相符即可結案；遇泡水遺失無法補單者，由<strong>許主任簽核特案異常結案</strong>。
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">已結案 / 待結案：</span>
            <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {closedSlips.length} / {auditedSlips.length} 筆
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
