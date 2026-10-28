import React, { useState } from 'react';
import { X, Plus, AlertCircle, FilePlus2, Sparkles } from 'lucide-react';
import { ChargeSlip, DocumentType, AppUser } from '../types';

interface NewSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSlips: ChargeSlip[];
  currentUser: AppUser;
  allUsers: AppUser[];
  onAddSlip: (slip: ChargeSlip) => void;
}

export const NewSlipModal: React.FC<NewSlipModalProps> = ({
  isOpen,
  onClose,
  existingSlips,
  currentUser,
  allUsers,
  onAddSlip,
}) => {
  if (!isOpen) return null;

  // Generate next sequential slip ID
  const nextSeq = existingSlips.length + 1;
  const suggestedId = `CS-202610-${String(nextSeq).padStart(3, '0')}`;

  const [id, setId] = useState(suggestedId);
  const [orderNo, setOrderNo] = useState(`ORD-202610-${8800 + nextSeq}`);
  const [customerName, setCustomerName] = useState('');
  const [transactionDate, setTransactionDate] = useState('2026-10-26');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountingAmount, setAccountingAmount] = useState<number | ''>('');
  const [documentType, setDocumentType] = useState<DocumentType>('DELIVERY_SLIP');
  const [responsiblePersonId, setResponsiblePersonId] = useState('DLV-01');
  const [expectedDueDate, setExpectedDueDate] = useState('2026-10-29'); // T+3 default
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Field persons list
  const fieldPersonnel = allUsers.filter(u => u.role === 'DELIVERY' || u.role === 'ONSITE' || u.role === 'SALES');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedId = id.trim();
    if (!trimmedId) {
      setErrorMessage('請填寫簽帳單編號');
      return;
    }

    // F01-06 & AT-02: Prevent Duplicate ID
    const duplicate = existingSlips.find(s => s.id.toLowerCase() === trimmedId.toLowerCase());
    if (duplicate) {
      setErrorMessage(`[AT-02 防止重複] 簽帳單編號「${trimmedId}」已存在！已由客戶「${duplicate.customerName}」於 ${duplicate.transactionDate} 建立，系統拒絕重複建立。`);
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('請輸入客戶名稱');
      return;
    }

    const numAmount = Number(amount);
    if (amount === '' || isNaN(numAmount) || numAmount < 0) {
      setErrorMessage('簽帳金額必須為大於或等於 0 的數字');
      return;
    }

    const assignedPerson = allUsers.find(u => u.code === responsiblePersonId) || {
      name: '王大明',
      role: 'DELIVERY',
      roleTitle: '送貨人員',
    };

    const newSlip: ChargeSlip = {
      id: trimmedId,
      orderNo: orderNo.trim() || undefined,
      customerName: customerName.trim(),
      transactionDate,
      amount: numAmount,
      accountingAmount: accountingAmount !== '' ? Number(accountingAmount) : numAmount,
      responsiblePersonId,
      responsiblePersonName: assignedPerson.name,
      responsiblePersonRole: assignedPerson.roleTitle.split(' ')[0] || '送貨人員',
      documentType,
      expectedDueDate,
      status: 'PENDING_SUBMISSION',
      auditStatus: 'PENDING',
      notes: notes.trim() || undefined,
      trackingLogs: [],
      historyLogs: [
        {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          operator: currentUser.name,
          operatorRole: currentUser.roleTitle,
          action: '新增簽帳單 (F01-01)',
          details: `手動新增簽帳單，負責人指派為 ${assignedPerson.name}，預計繳交期限 ${expectedDueDate}`,
        },
      ],
    };

    onAddSlip(newSlip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <FilePlus2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">新增簽帳單資料 (F01)</h2>
              <p className="text-xs text-slate-300">產生唯一識別編號、記錄交易金額與指定負責外勤</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                簽帳單編號 <span className="text-rose-500">* (F01-02 唯一性)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="例: CS-202610-011"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">系統自動帶入不可重複之預設流水號</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ERP 銷貨訂單編號
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                placeholder="例: ORD-202610-8811"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                客戶名稱 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                placeholder="例: 華碩電腦股份有限公司"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                交易日期 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                實體簽帳金額 (NTD) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setAmount(val);
                  if (accountingAmount === '') setAccountingAmount(val);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-bold text-sm"
                placeholder="例: 65000"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                帳面預期金額 (ERP帳務比對基準)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={accountingAmount}
                onChange={(e) => setAccountingAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                placeholder="預設與實體簽帳相同"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                文件類型 <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="DELIVERY_SLIP">送貨簽帳單</option>
                <option value="ONSITE_SLIP">現場簽帳單</option>
                <option value="SPECIAL_ORDER">專案／特別簽帳單</option>
                <option value="REPAIR_SERVICE">維修服務簽收單</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                負責外勤人員 <span className="text-rose-500">* (F01-03)</span>
              </label>
              <select
                value={responsiblePersonId}
                onChange={(e) => setResponsiblePersonId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              >
                {fieldPersonnel.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code} - {p.roleTitle.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                預計繳交期限 <span className="text-rose-500">* (T+3規定期限)</span>
              </label>
              <input
                type="date"
                value={expectedDueDate}
                onChange={(e) => setExpectedDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">備註說明</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：交件需附客戶請款單發票副本..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              確認建立簽帳單
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
