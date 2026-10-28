/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  Scale, 
  AlertTriangle, 
  BarChart3, 
  CheckCircle2, 
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

import { ChargeSlip, AppUser, ErpBillingRecord, TrackingLog, ReceiptStatus, AuditStatus } from './types';
import { INITIAL_USERS, INITIAL_CHARGE_SLIPS, ERP_BILLING_RECORDS } from './data/mockData';
import { Header } from './components/Header';
import { SlipListTab } from './components/SlipListTab';
import { HandoverTab } from './components/HandoverTab';
import { ReconciliationTab } from './components/ReconciliationTab';
import { MissingTrackingTab } from './components/MissingTrackingTab';
import { ReportsTab } from './components/ReportsTab';
import { SlipDetailModal } from './components/SlipDetailModal';
import { NewSlipModal } from './components/NewSlipModal';
import { ImportSlipsModal } from './components/ImportSlipsModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AcceptanceTestModal } from './components/AcceptanceTestModal';
import { formatCurrency } from './utils/formatters';

const STORAGE_KEY = 'charge_slips_mgmt_data_v1';

export default function App() {
  // Current user state (Default: 陳淑芬 ACC-01 會計人員)
  const [currentUser, setCurrentUser] = useState<AppUser>(INITIAL_USERS[0]);

  // Slips state with localStorage persistence
  const [slips, setSlips] = useState<ChargeSlip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved slips data', e);
    }
    return INITIAL_CHARGE_SLIPS;
  });

  // ERP Records
  const [erpRecords] = useState<ErpBillingRecord[]>(ERP_BILLING_RECORDS);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'list' | 'handover' | 'reconciliation' | 'missing' | 'reports'>('list');

  // Modal dialog states
  const [selectedSlip, setSelectedSlip] = useState<ChargeSlip | null>(null);
  const [isNewSlipOpen, setIsNewSlipOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isAcceptanceTestOpen, setIsAcceptanceTestOpen] = useState(false);

  // Notification Toast Banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warn' | 'error' } | null>(null);

  // Save to localStorage when slips change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slips));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [slips]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' | 'error' = 'success') => {
    setToastMessage({ text, type });
  };

  // Reset to initial mock data
  const handleResetData = () => {
    setSlips(INITIAL_CHARGE_SLIPS);
    localStorage.removeItem(STORAGE_KEY);
    showToast('已重設為系統預設之 2026年10月 底完整測試情境資料！', 'info');
  };

  // ==================== WORKFLOW ACTION HANDLERS ====================

  // F02-02 登記繳交 (外勤送貨員/現場作業員)
  const handleSubmitSlip = (slipId: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'SUBMITTED_PENDING_RECEIPT' as ReceiptStatus,
          submissionDate: now,
          submittedBy: currentUser.name,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '登記繳交 (F02-02)',
              details: `${currentUser.name} 於系統登記交付簽單，狀態更新為「已繳交／待收件確認」`,
            },
          ],
        };
      })
    );
    showToast(`簽帳單「${slipId}」已成功登記繳交！請依規定將紙本單據投入會計收件槽。`, 'success');
  };

  // Batch submit
  const handleBatchSubmit = (slipIds: string[]) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (!slipIds.includes(s.id)) return s;
        return {
          ...s,
          status: 'SUBMITTED_PENDING_RECEIPT' as ReceiptStatus,
          submissionDate: now,
          submittedBy: currentUser.name,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}-${s.id}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '批次登記繳交 (F02-02)',
              details: `${currentUser.name} 批次登記交付，等待會計點收`,
            },
          ],
        };
      })
    );
    showToast(`已批次登記繳交 ${slipIds.length} 筆簽帳單！狀態更新為「待收件確認」。`, 'success');
  };

  // F02-03 會計確認收件點收 (重要規則: 已繳交 != 已收件)
  const handleReceiveSlip = (slipId: string, remarks?: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'RECEIVED_PENDING_AUDIT' as ReceiptStatus,
          receiptDate: now,
          receivedBy: currentUser.name,
          receiptRemarks: remarks || '會計點收紙本正本無誤，核驗簽收章完整',
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '會計收件確認 (F02-03)',
              details: `會計人員 ${currentUser.name} 清點實體單據無誤並蓋章收訖，狀態正式更新為「已收件／待核對」`,
            },
          ],
        };
      })
    );
    showToast(`[會計收件完成] 簽帳單「${slipId}」已點收蓋章入庫，可執行帳務比對！`, 'success');
  };

  // Batch receive
  const handleBatchReceive = (slipIds: string[], remarks?: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (!slipIds.includes(s.id)) return s;
        return {
          ...s,
          status: 'RECEIVED_PENDING_AUDIT' as ReceiptStatus,
          receiptDate: now,
          receivedBy: currentUser.name,
          receiptRemarks: remarks || '批次點收紙本無誤',
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}-${s.id}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '批次會計收件確認 (F02-03)',
              details: `會計人員 ${currentUser.name} 批次點收收訖`,
            },
          ],
        };
      })
    );
    showToast(`已批次確認點收 ${slipIds.length} 筆簽帳單！`, 'success');
  };

  // F02-05 退回重繳 / 更正收件狀態
  const handleRejectSubmission = (slipId: string, reason: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'PENDING_SUBMISSION' as ReceiptStatus,
          submissionDate: undefined,
          submittedBy: undefined,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '退回重繳／更正狀態 (F02-05)',
              details: `會計退回原因: ${reason}`,
            },
          ],
        };
      })
    );
    showToast(`簽帳單「${slipId}」已退回外勤更正！退回原因已寫入操作稽核歷程。`, 'warn');
  };

  // F04-02 & F04-03 執行自動帳務比對勾稽
  const handleRunAutoReconciliation = () => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    let matchedCount = 0;
    let mismatchCount = 0;
    let missingCount = 0;

    setSlips(prev =>
      prev.map(s => {
        // Find corresponding ERP billing record
        const erp = erpRecords.find(e => e.expectedSlipId === s.id || e.orderNo === s.orderNo);
        const accountingAmt = erp ? erp.accountingAmount : s.accountingAmount || s.amount;
        const diff = accountingAmt - s.amount;

        // If not received yet
        if (!s.receiptDate) {
          missingCount++;
          return {
            ...s,
            status: 'ANOMALY' as ReceiptStatus,
            auditStatus: 'MISSING_SLIP' as AuditStatus,
            accountingAmount: accountingAmt,
            anomalyReason: '銷貨帳目已立帳，但會計尚未收到實體簽帳單 (缺單未收件)',
            historyLogs: [
              ...s.historyLogs,
              {
                id: `hist-audit-${Date.now()}-${s.id}`,
                timestamp: now,
                operator: currentUser.name,
                operatorRole: currentUser.roleTitle,
                action: '執行帳務比對 (F04-02)',
                details: '比對結果：缺單未收到實體單據，列管為缺單追蹤項目',
              },
            ],
          };
        }

        // Amount mismatch check (F04-03 & AT-05)
        if (Math.abs(diff) > 0.01) {
          mismatchCount++;
          return {
            ...s,
            status: 'ANOMALY' as ReceiptStatus,
            auditStatus: 'AMOUNT_MISMATCH' as AuditStatus,
            accountingAmount: accountingAmt,
            anomalyReason: `簽單實簽金額 (${formatCurrency(s.amount)}) 與 ERP 帳面金額 (${formatCurrency(accountingAmt)}) 相差 ${formatCurrency(diff)}，需人工確認折讓或扣款`,
            historyLogs: [
              ...s.historyLogs,
              {
                id: `hist-audit-${Date.now()}-${s.id}`,
                timestamp: now,
                operator: currentUser.name,
                operatorRole: currentUser.roleTitle,
                action: '執行帳務比對 (F04-03)',
                details: `比對結果：金額不符！差額 ${formatCurrency(diff)}，標示異常待查`,
              },
            ],
          };
        }

        // Exact match!
        matchedCount++;
        return {
          ...s,
          status: 'AUDITED' as ReceiptStatus,
          auditStatus: 'MATCHED' as AuditStatus,
          accountingAmount: accountingAmt,
          auditNote: '單據齊全，金額比對一致，符合月結結案標準',
          anomalyReason: undefined,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-audit-${Date.now()}-${s.id}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '執行帳務比對 (F04-03)',
              details: '比對結果：帳實相符無訛，狀態更新為「核對完成」',
            },
          ],
        };
      })
    );

    showToast(`[帳務核對完成] 帳實相符: ${matchedCount} 筆 ｜ 金額不符: ${mismatchCount} 筆 ｜ 缺單未收: ${missingCount} 筆`, 'info');
  };

  // F04-05 異常人工調解確認
  const handleResolveAnomaly = (slipId: string, resolutionNote: string, adjustAccountingAmount?: number) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'AUDITED' as ReceiptStatus,
          auditStatus: 'MATCHED' as AuditStatus,
          accountingAmount: adjustAccountingAmount !== undefined ? adjustAccountingAmount : s.accountingAmount,
          auditNote: `【人工調解完成】${resolutionNote}`,
          anomalyReason: undefined,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '異常人工調解確認 (F04-05)',
              details: `調解記錄: ${resolutionNote} (核定金額: NT$ ${adjustAccountingAmount ?? s.amount})`,
            },
          ],
        };
      })
    );
    showToast(`簽帳單「${slipId}」已完成人工調解並標記為核對完成！`, 'success');
  };

  // F04-06 結案核銷 (AT-08 權限攔截 & AT-10 結案記錄)
  const handleCloseSlip = (slipId: string) => {
    // AT-08: Check authorization! Delivery / Onsite staff cannot close!
    if (currentUser.role === 'DELIVERY' || currentUser.role === 'ONSITE' || currentUser.role === 'SALES') {
      showToast(`[AT-08 拒絕操作] 您目前的角色身分是「${currentUser.roleTitle}」，無會計結案權限！請由會計人員或會計主管執行。`, 'error');
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'CLOSED' as ReceiptStatus,
          closedAt: now,
          closedBy: currentUser.name,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '月結結案 (F04-06)',
              details: `由 ${currentUser.name} (${currentUser.roleTitle}) 正式執行月底月結結案，立帳歸檔`,
            },
          ],
        };
      })
    );
    showToast(`簽帳單「${slipId}」已正式結案歸檔！`, 'success');
  };

  // Batch Close Audited
  const handleBatchCloseAudited = () => {
    if (currentUser.role === 'DELIVERY' || currentUser.role === 'ONSITE' || currentUser.role === 'SALES') {
      showToast(`[AT-08 拒絕操作] 您目前的角色無會計結案權限！`, 'error');
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    let closedCount = 0;
    setSlips(prev =>
      prev.map(s => {
        if (s.status !== 'AUDITED') return s;
        closedCount++;
        return {
          ...s,
          status: 'CLOSED' as ReceiptStatus,
          closedAt: now,
          closedBy: currentUser.name,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-batch-close-${Date.now()}-${s.id}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '批次月結結案 (F04-06)',
              details: `由 ${currentUser.name} 完成批次結案`,
            },
          ],
        };
      })
    );
    showToast(`已成功將 ${closedCount} 筆核對完成的簽帳單進行月底批次結案！`, 'success');
  };

  // F05-06 補件收件確認 (AT-07)
  const handleConfirmSupplement = (slipId: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'RECEIVED_PENDING_AUDIT' as ReceiptStatus,
          auditStatus: 'IN_PROGRESS' as AuditStatus,
          receiptDate: now,
          receivedBy: currentUser.name,
          anomalyReason: undefined,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-supp-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '補件收件確認 (F05-06 / AT-07)',
              details: `外勤人員已繳回補件單據，由會計人員 ${currentUser.name} 驗收點收完畢，重回核對流程`,
            },
          ],
        };
      })
    );
    showToast(`[AT-07 補件成功] 簽帳單「${slipId}」已完成補件點收！狀態更新為已收件。`, 'success');
  };

  // F05-07 主管特案異常結案
  const handleExceptionClose = (slipId: string, reason: string) => {
    if (currentUser.role !== 'SUPERVISOR' && currentUser.role !== 'ADMIN') {
      showToast('只有會計主管或系統管理員具特案異常結案權限！', 'error');
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          status: 'EXCEPTION_CLOSED' as ReceiptStatus,
          supervisorApprovedBy: `${currentUser.name} (${currentUser.roleTitle})`,
          closedAt: now,
          closedBy: currentUser.name,
          anomalyReason: `【主管特案結案】${reason}`,
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-exclose-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '主管特案異常結案 (F05-07)',
              details: `主管特案核准理由: ${reason}`,
            },
          ],
        };
      })
    );
    showToast(`簽帳單「${slipId}」已依主管指示完成特案結案，完整歷史紀錄已封存！`, 'info');
  };

  // F05-05 記錄催單追蹤歷程
  const handleAddTrackingLog = (slipId: string, logData: Omit<TrackingLog, 'id' | 'timestamp' | 'operatorName'>) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newLog: TrackingLog = {
      id: `track-${Date.now()}`,
      timestamp: now,
      operatorName: currentUser.name,
      ...logData,
    };

    setSlips(prev =>
      prev.map(s => {
        if (s.id !== slipId) return s;
        return {
          ...s,
          trackingLogs: [...s.trackingLogs, newLog],
          historyLogs: [
            ...s.historyLogs,
            {
              id: `hist-track-${Date.now()}`,
              timestamp: now,
              operator: currentUser.name,
              operatorRole: currentUser.roleTitle,
              action: '催單歷程記錄 (F05-05)',
              details: `聯絡 ${newLog.contactTarget} (${newLog.contactType}): ${newLog.responseSummary}${newLog.promisedDate ? `，承諾補件日: ${newLog.promisedDate}` : ''}`,
            },
          ],
        };
      })
    );
    showToast(`已成功登載「${slipId}」之催單溝通紀錄！`, 'success');
  };

  // F01-01 新增簽帳單
  const handleAddSlip = (newSlip: ChargeSlip) => {
    setSlips(prev => [newSlip, ...prev]);
    showToast(`[AT-01 建立成功] 簽帳單編號「${newSlip.id}」已成功新增！`, 'success');
  };

  // F01-05 批次匯入簽帳單
  const handleImportSlips = (importedSlips: ChargeSlip[]) => {
    setSlips(prev => [...importedSlips, ...prev]);
    showToast(`[F01-05 匯入成功] 已成功批次建立 ${importedSlips.length} 筆簽帳單！`, 'success');
  };

  // Synchronize modal detail if slips updated
  useEffect(() => {
    if (selectedSlip) {
      const refreshed = slips.find(s => s.id === selectedSlip.id);
      if (refreshed) setSelectedSlip(refreshed);
    }
  }, [slips]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Header with Navigation Bar & User Switcher */}
      <Header
        currentUser={currentUser}
        allUsers={INITIAL_USERS}
        onSelectUser={setCurrentUser}
        slips={slips}
        onOpenAcceptanceTest={() => setIsAcceptanceTestOpen(true)}
        onOpenBarcodeScanner={() => setIsBarcodeOpen(true)}
        onResetData={handleResetData}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'warn'
                ? 'bg-amber-900 text-amber-100 border-amber-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-indigo-950 text-indigo-100 border-indigo-800'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white ml-2 text-sm font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-white px-3 sm:px-4 rounded-xl shadow-xs overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3.5 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>簽帳單總覽與查詢 (F01 & F03)</span>
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {slips.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('handover')}
            className={`py-3.5 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'handover'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>繳交與收件交接台 (F02)</span>
            {slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT').length > 0 && (
              <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {slips.filter(s => s.status === 'SUBMITTED_PENDING_RECEIPT').length} 待收
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`py-3.5 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'reconciliation'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>帳務核對工作台 (F04)</span>
            {slips.filter(s => s.status === 'AUDITED').length > 0 && (
              <span className="bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {slips.filter(s => s.status === 'AUDITED').length} 待結案
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('missing')}
            className={`py-3.5 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'missing'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>缺單追蹤與催辦中心 (F05)</span>
            {slips.filter(s => s.status === 'ANOMALY' || s.auditStatus === 'MISSING_SLIP').length > 0 && (
              <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {slips.filter(s => s.status === 'ANOMALY' || s.auditStatus === 'MISSING_SLIP').length} 缺單
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3.5 px-3.5 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>管理與月結報表 (F06)</span>
          </button>
        </div>

        {/* Tab 1: 簽帳單總覽與查詢 (F01 & F03) */}
        {activeTab === 'list' && (
          <SlipListTab
            slips={slips}
            currentUser={currentUser}
            onOpenNewSlip={() => setIsNewSlipOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            onSelectSlip={setSelectedSlip}
            onSubmitSlip={handleSubmitSlip}
            onReceiveSlip={handleReceiveSlip}
          />
        )}

        {/* Tab 2: 繳交與收件交接台 (F02) */}
        {activeTab === 'handover' && (
          <HandoverTab
            slips={slips}
            currentUser={currentUser}
            onBatchSubmit={handleBatchSubmit}
            onBatchReceive={handleBatchReceive}
            onRejectSubmission={handleRejectSubmission}
            onSelectSlip={setSelectedSlip}
            onOpenBarcodeScanner={() => setIsBarcodeOpen(true)}
          />
        )}

        {/* Tab 3: 帳務核對工作台 (F04) */}
        {activeTab === 'reconciliation' && (
          <ReconciliationTab
            slips={slips}
            erpRecords={erpRecords}
            currentUser={currentUser}
            onRunAutoReconciliation={handleRunAutoReconciliation}
            onResolveAnomaly={handleResolveAnomaly}
            onCloseSlip={handleCloseSlip}
            onSelectSlip={setSelectedSlip}
            onBatchCloseAudited={handleBatchCloseAudited}
          />
        )}

        {/* Tab 4: 缺單追蹤與催辦中心 (F05) */}
        {activeTab === 'missing' && (
          <MissingTrackingTab
            slips={slips}
            currentUser={currentUser}
            onSelectSlip={setSelectedSlip}
            onAddTrackingLog={handleAddTrackingLog}
            onConfirmSupplement={handleConfirmSupplement}
            onExceptionCloseSlip={handleExceptionClose}
          />
        )}

        {/* Tab 5: 管理與月結報表 (F06) */}
        {activeTab === 'reports' && (
          <ReportsTab
            slips={slips}
            currentUser={currentUser}
            onSelectSlip={setSelectedSlip}
          />
        )}
      </main>

      {/* Modals */}
      <SlipDetailModal
        slip={selectedSlip}
        currentUser={currentUser}
        onClose={() => setSelectedSlip(null)}
        onSubmitSlip={handleSubmitSlip}
        onReceiveSlip={handleReceiveSlip}
        onRejectSubmission={handleRejectSubmission}
        onAddTrackingLog={handleAddTrackingLog}
        onConfirmSupplement={handleConfirmSupplement}
        onCloseSlip={handleCloseSlip}
        onExceptionCloseSlip={handleExceptionClose}
      />

      <NewSlipModal
        isOpen={isNewSlipOpen}
        onClose={() => setIsNewSlipOpen(false)}
        existingSlips={slips}
        currentUser={currentUser}
        allUsers={INITIAL_USERS}
        onAddSlip={handleAddSlip}
      />

      <ImportSlipsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        existingSlips={slips}
        currentUser={currentUser}
        onImportSlips={handleImportSlips}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        slips={slips}
        currentUser={currentUser}
        onQuickReceive={handleReceiveSlip}
      />

      <AcceptanceTestModal
        isOpen={isAcceptanceTestOpen}
        onClose={() => setIsAcceptanceTestOpen(false)}
        slips={slips}
        currentUser={currentUser}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        onOpenNewSlip={() => setIsNewSlipOpen(true)}
        onSelectSlip={setSelectedSlip}
        onTriggerAlert={(msg) => showToast(msg, 'info')}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-10 py-4 px-6 text-center text-xs text-slate-500">
        簽帳單管理與帳務核對系統 ｜ 嚴守「簽帳單可追蹤、責任可查詢、缺單能預警、帳務可核對」企業內控原則 ｜ 2026 財務會計部
      </footer>
    </div>
  );
}
