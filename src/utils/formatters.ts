import { ReceiptStatus, AuditStatus, DocumentType, UserRole } from '../types';

export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'NT$ 0';
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('TWD', 'NT$');
};

export const getDocumentTypeLabel = (type: DocumentType): string => {
  switch (type) {
    case 'DELIVERY_SLIP':
      return '送貨簽帳單';
    case 'ONSITE_SLIP':
      return '現場簽帳單';
    case 'SPECIAL_ORDER':
      return '專案簽帳單';
    case 'REPAIR_SERVICE':
      return '維修簽收單';
    default:
      return type;
  }
};

export const getStatusMeta = (status: ReceiptStatus): {
  label: string;
  badgeClass: string;
  bgClass: string;
  dotColor: string;
  desc: string;
} => {
  switch (status) {
    case 'PENDING_SUBMISSION':
      return {
        label: '待繳交',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        bgClass: 'bg-amber-500',
        dotColor: '#f59e0b',
        desc: '外勤或送貨人員持有中，尚未繳回',
      };
    case 'SUBMITTED_PENDING_RECEIPT':
      return {
        label: '已繳交／待收件確認',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 font-semibold',
        bgClass: 'bg-blue-500',
        dotColor: '#3b82f6',
        desc: '負責人已登記交件，會計尚未檢驗實體收件',
      };
    case 'RECEIVED_PENDING_AUDIT':
      return {
        label: '已收件／待核對',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        bgClass: 'bg-indigo-500',
        dotColor: '#6366f1',
        desc: '會計已點收實體單據，等待帳務勾稽',
      };
    case 'AUDITING':
      return {
        label: '核對中',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        bgClass: 'bg-purple-500',
        dotColor: '#a855f7',
        desc: '正在比對銷貨帳目與實體金額',
      };
    case 'ANOMALY':
      return {
        label: '異常追蹤 (缺單/不符)',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse',
        bgClass: 'bg-rose-500',
        dotColor: '#f43f5e',
        desc: '缺單逾期或簽帳金額與帳面不符，列管追查',
      };
    case 'AUDITED':
      return {
        label: '核對完成',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200 font-medium',
        bgClass: 'bg-teal-500',
        dotColor: '#14b8a6',
        desc: '單據已到齊，帳實相符，待批次月結',
      };
    case 'CLOSED':
      return {
        label: '已結案',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
        bgClass: 'bg-emerald-600',
        dotColor: '#059669',
        desc: '月底帳務核銷完畢，正式立帳歸檔',
      };
    case 'EXCEPTION_CLOSED':
      return {
        label: '特案異常結案',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
        bgClass: 'bg-slate-600',
        dotColor: '#475569',
        desc: '經主管特別簽核核准結案 (附簽呈文件與紀錄)',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        bgClass: 'bg-gray-400',
        dotColor: '#9ca3af',
        desc: '',
      };
  }
};

export const getAuditStatusMeta = (auditStatus: AuditStatus) => {
  switch (auditStatus) {
    case 'MATCHED':
      return {
        label: '比對吻合',
        class: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    case 'AMOUNT_MISMATCH':
      return {
        label: '金額不符',
        class: 'text-rose-700 bg-rose-50 border-rose-300 font-bold',
      };
    case 'MISSING_SLIP':
      return {
        label: '缺單未收',
        class: 'text-orange-700 bg-orange-50 border-orange-300 font-bold',
      };
    case 'DUPLICATE':
      return {
        label: '編號重複',
        class: 'text-red-700 bg-red-50 border-red-300 font-bold',
      };
    case 'DATA_INCOMPLETE':
      return {
        label: '資料不全',
        class: 'text-amber-700 bg-amber-50 border-amber-300',
      };
    case 'IN_PROGRESS':
      return {
        label: '比對中',
        class: 'text-blue-700 bg-blue-50 border-blue-200',
      };
    default:
      return {
        label: '待核對',
        class: 'text-gray-600 bg-gray-50 border-gray-200',
      };
  }
};

export const calcOverdueDays = (expectedDueDate: string, targetDateStr?: string): number => {
  if (!expectedDueDate) return 0;
  const due = new Date(expectedDueDate + 'T23:59:59').getTime();
  const current = targetDateStr ? new Date(targetDateStr).getTime() : new Date('2026-10-26T23:59:59').getTime();
  const diffTime = current - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const getRoleTitle = (role: UserRole): string => {
  switch (role) {
    case 'ACCOUNTANT':
      return '會計人員';
    case 'DELIVERY':
      return '送貨人員';
    case 'ONSITE':
      return '現場作業人員';
    case 'SALES':
      return '業務人員';
    case 'SUPERVISOR':
      return '會計主管';
    case 'ADMIN':
      return '系統管理員';
    default:
      return role;
  }
};
