import { ChargeSlip, DocumentType, ReceiptStatus, AuditStatus } from '../types';
import { getDocumentTypeLabel, getStatusMeta, getAuditStatusMeta } from './formatters';

export const exportSlipsToCsv = (slips: ChargeSlip[], filename: string = '簽帳單核對清單.csv') => {
  const headers = [
    '簽帳單編號',
    '銷貨單號',
    '客戶名稱',
    '交易日期',
    '實簽金額',
    '帳務金額',
    '差異金額',
    '負責人',
    '負責人身分',
    '文件類型',
    '預計繳交日',
    '實際繳交時間',
    '會計收件時間',
    '收件確認人',
    '簽單狀態',
    '帳務核對狀態',
    '異常原因',
    '備註',
  ];

  const rows = slips.map((slip) => {
    const diff = (slip.accountingAmount || slip.amount) - slip.amount;
    return [
      `"${slip.id}"`,
      `"${slip.orderNo || ''}"`,
      `"${slip.customerName.replace(/"/g, '""')}"`,
      `"${slip.transactionDate}"`,
      slip.amount,
      slip.accountingAmount || slip.amount,
      diff,
      `"${slip.responsiblePersonName}"`,
      `"${slip.responsiblePersonRole}"`,
      `"${getDocumentTypeLabel(slip.documentType)}"`,
      `"${slip.expectedDueDate}"`,
      `"${slip.submissionDate || '未繳交'}"`,
      `"${slip.receiptDate || '未收件'}"`,
      `"${slip.receivedBy || '尚未收件'}"`,
      `"${getStatusMeta(slip.status).label}"`,
      `"${getAuditStatusMeta(slip.auditStatus).label}"`,
      `"${(slip.anomalyReason || '').replace(/"/g, '""')}"`,
      `"${(slip.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateSampleCsvTemplate = (): string => {
  const headers = ['簽帳單編號', '銷貨單號', '客戶名稱', '交易日期', '簽帳金額', '帳務金額', '負責人代號', '負責人姓名', '文件類型(送貨簽帳單/現場簽帳單/專案簽帳單/維修簽收單)', '預計繳交日期', '備註說明'];
  const sampleRow1 = ['CS-202610-020', 'ORD-202610-8820', '新光三越信義新天地', '2026-10-25', '75000', '75000', 'DLV-01', '王大明', '送貨簽帳單', '2026-10-28', '收銀後勤耗材批次簽收'];
  const sampleRow2 = ['CS-202610-021', 'ORD-202610-8821', '微星科技中和廠', '2026-10-26', '124000', '124000', 'OPS-01', '張建國', '現場簽帳單', '2026-10-29', '現場自提急件'];
  return '\uFEFF' + [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\r\n');
};

export const parseSlipsFromCsv = (csvText: string): { slips: Partial<ChargeSlip>[]; errors: string[] } => {
  const lines = csvText.trim().split(/\r\n|\n|\r/);
  const slips: Partial<ChargeSlip>[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    errors.push('CSV 檔案無資料內容');
    return { slips, errors };
  }

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser supporting quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim().replace(/^"|"$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^"|"$/g, ''));

    const [id, orderNo, customerName, transactionDate, amountStr, acctAmountStr, respId, respName, docTypeStr, dueDate, notes] = values;

    if (!id || !customerName || !amountStr || !respName) {
      errors.push(`第 ${i + 1} 行欄位不完整 (需有簽帳單編號、客戶名稱、金額與負責人)`);
      continue;
    }

    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount < 0) {
      errors.push(`第 ${i + 1} 行金額格式錯誤: "${amountStr}"`);
      continue;
    }

    const accountingAmount = acctAmountStr ? parseFloat(acctAmountStr.replace(/[^0-9.-]/g, '')) : amount;

    let docType: DocumentType = 'DELIVERY_SLIP';
    if (docTypeStr?.includes('現場')) docType = 'ONSITE_SLIP';
    else if (docTypeStr?.includes('專案')) docType = 'SPECIAL_ORDER';
    else if (docTypeStr?.includes('維修')) docType = 'REPAIR_SERVICE';

    slips.push({
      id,
      orderNo: orderNo || `ORD-${id}`,
      customerName,
      transactionDate: transactionDate || new Date().toISOString().slice(0, 10),
      amount,
      accountingAmount,
      responsiblePersonId: respId || 'DLV-01',
      responsiblePersonName: respName,
      responsiblePersonRole: docType === 'ONSITE_SLIP' ? '現場作業人員' : '送貨人員',
      documentType: docType,
      expectedDueDate: dueDate || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      status: 'PENDING_SUBMISSION' as ReceiptStatus,
      auditStatus: 'PENDING' as AuditStatus,
      notes: notes || '',
      trackingLogs: [],
      historyLogs: [
        {
          id: `hist-import-${Date.now()}-${i}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          operator: '批次匯入作業',
          operatorRole: '系統',
          action: 'CSV 批次匯入',
          details: `從 CSV 匯入建立簽帳單，金額 NT$ ${amount}`,
        },
      ],
    });
  }

  return { slips, errors };
};
