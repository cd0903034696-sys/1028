export type ReceiptStatus =
  | 'PENDING_SUBMISSION'        // 待繳交 (外勤人員持有中)
  | 'SUBMITTED_PENDING_RECEIPT' // 已繳交／待收件確認 (外勤已登記，會計尚未實體收件)
  | 'RECEIVED_PENDING_AUDIT'   // 已收件／待核對 (會計已確認點收)
  | 'AUDITING'                 // 核對中
  | 'ANOMALY'                  // 異常追蹤 (缺單、金額不符、資料缺漏)
  | 'AUDITED'                  // 核對完成
  | 'CLOSED'                   // 已結案 (月結完成)
  | 'EXCEPTION_CLOSED';        // 特案異常結案 (附核准主管與原因)

export type AuditStatus =
  | 'PENDING'                  // 待核對
  | 'IN_PROGRESS'              // 核對中
  | 'MATCHED'                  // 核對吻合 (金額無誤)
  | 'AMOUNT_MISMATCH'          // 金額不符
  | 'MISSING_SLIP'             // 缺單 (有帳無單)
  | 'DUPLICATE'                // 編號重複
  | 'DATA_INCOMPLETE';         // 資料不全

export type DocumentType =
  | 'DELIVERY_SLIP'            // 送貨簽帳單
  | 'ONSITE_SLIP'              // 現場簽帳單
  | 'SPECIAL_ORDER'            // 專案／特別簽帳單
  | 'REPAIR_SERVICE';          // 維修服務簽收單

export type UserRole =
  | 'ACCOUNTANT'               // 會計人員
  | 'DELIVERY'                 // 送貨人員
  | 'ONSITE'                   // 現場作業人員
  | 'SALES'                    // 業務人員
  | 'SUPERVISOR'               // 會計主管
  | 'ADMIN';                   // 系統管理員

export interface AppUser {
  id: string;
  name: string;
  code: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  phone: string;
  email: string;
  avatarBg: string;
}

export interface TrackingLog {
  id: string;
  timestamp: string;
  contactType: 'PHONE' | 'LINE' | 'IN_PERSON' | 'EMAIL';
  contactTarget: string;       // 聯絡對象
  targetPhone?: string;
  responseSummary: string;     // 回覆內容與原因
  promisedDate?: string;       // 承諾補件日期
  operatorName: string;        // 追蹤會計人員
  statusNote?: string;
}

export interface AuditHistoryLog {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  action: string;
  details: string;
}

export interface ChargeSlip {
  id: string;                  // 簽帳單編號 (唯一，例: CS-202610-001)
  orderNo?: string;            // 關聯銷貨訂單編號 (ERP 單號，例: ORD-202610-8801)
  customerName: string;        // 客戶名稱
  customerCode?: string;       // 客戶代號 (例: CUST-012)
  transactionDate: string;     // 交易日期 (YYYY-MM-DD)
  amount: number;              // 實體簽帳金額 (NTD)
  accountingAmount?: number;   // 帳務預期金額 (ERP/帳面金額，用於比對)
  responsiblePersonId: string; // 負責人代號
  responsiblePersonName: string;// 負責人姓名
  responsiblePersonRole: string;// 送貨人員 / 現場作業人員
  responsiblePersonPhone?: string;// 負責人聯絡電話
  documentType: DocumentType;  // 文件類型
  expectedDueDate: string;     // 預計繳交期限 (YYYY-MM-DD)
  
  // 繳交與收件資訊
  submissionDate?: string;     // 實際登記繳交時間 (YYYY-MM-DD HH:mm)
  submittedBy?: string;        // 繳交人
  receiptDate?: string;        // 會計確認收件時間 (YYYY-MM-DD HH:mm)
  receivedBy?: string;         // 會計收件人
  receiptRemarks?: string;     // 收件備註 (例: 紙本有折損、印章清晰)
  
  // 核對資訊
  status: ReceiptStatus;       // 簽帳單生命週期狀態
  auditStatus: AuditStatus;    // 帳務核對狀態
  anomalyReason?: string;      // 異常原因 (缺單、金額不符、簽名模糊等)
  auditNote?: string;          // 會計核對備註
  
  // 結案資訊
  closedAt?: string;           // 結案時間
  closedBy?: string;           // 結案人
  supervisorApprovedBy?: string; // 特案異常結案核准主管
  
  // 附加資料
  slipImageUrl?: string;       // 簽帳單影像／簽章照片 (可上傳或預覽)
  trackingLogs: TrackingLog[]; // 缺單追蹤歷程
  historyLogs: AuditHistoryLog[]; // 操作稽核軌跡
  notes?: string;              // 一般備註
}

export interface ErpBillingRecord {
  orderNo: string;
  customerName: string;
  transactionDate: string;
  accountingAmount: number;
  expectedSlipId: string;
  salesPerson: string;
  productSummary: string;
}
