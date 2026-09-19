export type UserRole =
  | 'Administrator'
  | 'Accountant'
  | 'Salesperson'
  | 'Purchase Officer'
  | 'Warehouse User'
  | 'Manager'
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  approvalLimit: number; // in base currency
  branchId: string;
}

export type LetterheadPreset = 'diamond' | 'apex' | 'cube' | 'leaf' | 'monogram';
export type LetterheadLayout = 'split' | 'centered' | 'minimal';

export interface LetterheadConfig {
  showLogo: boolean;
  logoUrl?: string; // custom image url or base64 data url
  logoType: 'custom' | 'preset';
  presetId: LetterheadPreset;
  logoHeight: number; // e.g. 44px
  layout: LetterheadLayout;
  showCompanyDetails: boolean;
  tagline?: string;
  accentColor?: string;
}

export interface Company {
  id: string;
  name: string;
  legalName: string;
  taxRegistrationNumber: string;
  currency: string;
  currencySymbol: string;
  fiscalYearStart: string; // e.g. "01-01"
  logoUrl?: string;
  letterhead?: LetterheadConfig;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface Branch {
  id: string;
  companyId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface Partner {
  id: string;
  type: 'customer' | 'vendor' | 'both';
  name: string;
  contactPerson?: string;
  companyName?: string;
  category?: string;
  email: string;
  phone: string;
  taxNumber: string;
  paymentTermsDays: number;
  creditLimit: number;
  currentBalance: number; // positive = owes us (receivable), negative = we owe them (payable)
  currency: string;
  priceListId?: string;
  billingAddress: string;
  shippingAddress: string;
  bankDetails?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  barcode: string;
  sellingPrice: number;
  purchasePrice: number;
  taxRatePercent: number;
  minStockLevel: number;
  costingMethod: 'FIFO' | 'Weighted Average' | 'Standard';
  imageUrl?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  branchId: string;
}

export interface StockLevel {
  productId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  incoming: number;
  outgoing: number;
  // Available = onHand - reserved
}

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  movementType: 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment' | 'Damaged/Lost' | 'Return';
  quantity: number; // positive or negative
  referenceDocType: 'PO' | 'SO' | 'Manual' | 'Stock Count';
  referenceDocId: string;
  unitCost: number;
  performedBy: string;
  batchNumber?: string;
  notes?: string;
}

export type OrderStatus = 'Draft' | 'Pending Approval' | 'Confirmed' | 'Delivered' | 'Invoiced' | 'Cancelled';

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  partnerId: string;
  partnerName: string;
  branchId: string;
  salespersonId: string;
  salespersonName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: OrderStatus;
  lines: OrderLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvalDate?: string;
  invoiceId?: string;
  deliveryNoteId?: string;
}

export type InvoiceStatus = 'Draft' | 'Confirmed' | 'Posted' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  partnerId: string;
  partnerName: string;
  branchId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: OrderLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
  journalEntryId?: string;
}

export type PurchaseStatus = 'RFQ' | 'Pending Approval' | 'Ordered' | 'Goods Received' | 'Billed' | 'Completed' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  branchId: string;
  officerId: string;
  officerName: string;
  orderDate: string;
  expectedArrivalDate: string;
  status: PurchaseStatus;
  lines: OrderLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  requiresApproval: boolean;
  approvedBy?: string;
  notes?: string;
  billId?: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  purchaseOrderId?: string;
  vendorId: string;
  vendorName: string;
  branchId: string;
  billDate: string;
  dueDate: string;
  status: 'Draft' | 'Posted' | 'Paid' | 'Partially Paid' | 'Overdue';
  lines: OrderLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  journalEntryId?: string;
  // Scanned Document & OCR Auto-Update metadata
  scannedFileUrl?: string;
  scannedFileName?: string;
  scannedFileType?: 'pdf' | 'jpeg' | 'png' | 'scanned';
  scannedFileSize?: string;
  ocrExtracted?: boolean;
  ocrConfidence?: number;
  warehouseId?: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  date: string;
  type: 'Customer Receipt' | 'Vendor Payment';
  partnerId: string;
  partnerName: string;
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque';
  bankAccountId: string;
  invoiceId?: string;
  billId?: string;
  referenceNotes?: string;
  journalEntryId?: string;
}

export type DeliveryNoteStatus = 'Draft' | 'Ready for Dispatch' | 'Dispatched' | 'Delivered' | 'Returned';

export interface DeliveryNoteLine {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  orderedQuantity: number;
  dispatchedQuantity: number;
  backorderQuantity: number;
  unitOfMeasure?: string;
  serialOrLotNumber?: string;
  notes?: string;
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string; // e.g. DN-2026-001
  salesOrderId: string;
  salesOrderNumber: string;
  partnerId: string;
  customerName: string;
  customerContact?: string;
  customerPhone?: string;
  deliveryAddress: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  carrierName: string; // e.g. "Internal Fleet", "FedEx Express", "DHL Freight"
  trackingNumber?: string;
  driverName?: string;
  vehicleNumber?: string;
  status: DeliveryNoteStatus;
  lines: DeliveryNoteLine[];
  totalPackages?: number;
  totalWeightKg?: number;
  specialInstructions?: string;
  receivedBy?: string;
  receivedDate?: string;
  signatureReceived?: boolean;
  branchId: string;
  warehouseId?: string;
  createdAt: string;
}

export interface PickingListItem {
  productId: string;
  productName: string;
  productCode: string;
  category: string;
  barcode?: string;
  binLocation?: string;
  totalRequiredQuantity: number;
  pickedQuantity: number;
  isPicked: boolean;
  availableStock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  associatedOrders: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    quantity: number;
  }[];
}

export interface SameDateBatchPickingList {
  date: string;
  dateType: 'orderDate' | 'expectedDeliveryDate';
  branchId?: string;
  totalOrders: number;
  orderIds: string[];
  orderNumbers: string[];
  items: PickingListItem[];
  totalUnitsToPick: number;
  pickedUnits: number;
  status: 'Pending' | 'In Progress' | 'Completed';
  generatedAt: string;
  pickerName?: string;
}

export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  category: AccountCategory;
  normalBalance: 'Debit' | 'Credit';
  currentBalance: number;
  isReconcilable: boolean;
  description?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  journalType: 'Sales' | 'Purchases' | 'Cash' | 'Bank' | 'General' | 'Inventory';
  date: string;
  reference: string;
  notes: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'Draft' | 'Posted' | 'Locked';
  createdById: string;
  createdByName: string;
}

export interface StockCountItem {
  productId: string;
  productName: string;
  productCode: string;
  barcode: string;
  unit: string;
  expectedOnHand: number;
  countedQuantity: number;
  variance: number;
  scannedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'Created' | 'Updated' | 'Approved' | 'Cancelled' | 'Posted' | 'Synced' | 'Deleted';
  entityType:
    | 'SalesOrder'
    | 'Invoice'
    | 'PurchaseOrder'
    | 'VendorBill'
    | 'Stock'
    | 'JournalEntry'
    | 'Partner'
    | 'Payment'
    | 'Company'
    | 'DeliveryNote'
    | 'PickingList';
  entityId: string;
  entityReference: string;
  details: string;
  ipAddress?: string;
  previousState?: any;
  newState?: any;
}

export interface OfflineQueueItem {
  id: string;
  createdAt: string;
  action: 'CREATE_SO' | 'CREATE_INVOICE' | 'UPDATE_STOCK' | 'CREATE_PAYMENT' | 'CREATE_PARTNER';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'conflict';
  conflictReason?: string;
  retryCount: number;
}

export type DeviceViewMode = 'phone' | 'tablet' | 'desktop';
