import {
  Company,
  Branch,
  User,
  Partner,
  Product,
  Warehouse,
  StockLevel,
  StockMovement,
  SalesOrder,
  Invoice,
  PurchaseOrder,
  VendorBill,
  PaymentRecord,
  DeliveryNote,
  ChartOfAccount,
  JournalEntry,
  AuditLog,
} from '../types';

export const initialCompany: Company = {
  id: 'comp-main',
  name: 'Maxerp',
  legalName: 'Maxerp Enterprise Ltd.',
  taxRegistrationNumber: '',
  currency: 'USD',
  currencySymbol: '$',
  fiscalYearStart: '01-01',
  letterhead: {
    showLogo: true,
    logoType: 'preset',
    presetId: 'diamond',
    logoHeight: 48,
    layout: 'split',
    showCompanyDetails: true,
    tagline: 'Enterprise Resource & Operations Platform',
    accentColor: '#059669',
  },
  address: '',
  phone: '',
  email: '',
  website: '',
};

export const initialBranches: Branch[] = [
  {
    id: 'br-main',
    companyId: 'comp-main',
    code: 'MAIN-01',
    name: 'Main Branch',
    address: 'Headquarters',
    phone: '',
    isMain: true,
  },
];

export const initialUsers: User[] = [
  {
    id: 'usr-admin',
    name: 'System Administrator',
    email: 'admin@enterprise.local',
    role: 'Administrator',
    approvalLimit: 1000000,
    branchId: 'br-main',
  },
  {
    id: 'usr-mgr',
    name: 'Operations Manager',
    email: 'manager@enterprise.local',
    role: 'Manager',
    approvalLimit: 100000,
    branchId: 'br-main',
  },
  {
    id: 'usr-acct',
    name: 'Head Accountant',
    email: 'accountant@enterprise.local',
    role: 'Accountant',
    approvalLimit: 50000,
    branchId: 'br-main',
  },
  {
    id: 'usr-sales',
    name: 'Sales Executive',
    email: 'sales@enterprise.local',
    role: 'Salesperson',
    approvalLimit: 10000,
    branchId: 'br-main',
  },
  {
    id: 'usr-po',
    name: 'Purchasing Officer',
    email: 'purchasing@enterprise.local',
    role: 'Purchase Officer',
    approvalLimit: 20000,
    branchId: 'br-main',
  },
  {
    id: 'usr-wh',
    name: 'Inventory Specialist',
    email: 'warehouse@enterprise.local',
    role: 'Warehouse User',
    approvalLimit: 5000,
    branchId: 'br-main',
  },
  {
    id: 'usr-view',
    name: 'Auditor',
    email: 'auditor@enterprise.local',
    role: 'Viewer',
    approvalLimit: 0,
    branchId: 'br-main',
  },
];

export const initialWarehouses: Warehouse[] = [
  {
    id: 'wh-main',
    code: 'WH-01',
    name: 'Main Warehouse',
    location: 'Primary Zone',
    branchId: 'br-main',
  },
];

// Clean state: No demo partners (customers or vendors)
export const initialPartners: Partner[] = [];

// Clean state: No demo products
export const initialProducts: Product[] = [];

// Clean state: No demo stock levels
export const initialStockLevels: StockLevel[] = [];

// Clean state: No demo stock movements
export const initialStockMovements: StockMovement[] = [];

// Clean state: No demo sales orders
export const initialSalesOrders: SalesOrder[] = [];

// Clean state: No demo delivery notes
export const initialDeliveryNotes: DeliveryNote[] = [];

// Clean state: No demo customer invoices
export const initialInvoices: Invoice[] = [];

// Clean state: No demo purchase orders
export const initialPurchaseOrders: PurchaseOrder[] = [];

// Clean state: No demo vendor bills
export const initialVendorBills: VendorBill[] = [];

// Clean state: No demo payment records
export const initialPayments: PaymentRecord[] = [];

// Standard Double-Entry General Ledger (Chart of Accounts) with 0.00 balances
export const initialAccounts: ChartOfAccount[] = [
  // Assets (1000 - 1999)
  {
    id: 'acc-1010',
    code: '1010',
    name: 'Operating Bank Account (Commercial Checking)',
    category: 'Asset',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: true,
    description: 'Primary corporate commercial checking account.',
  },
  {
    id: 'acc-1020',
    code: '1020',
    name: 'Petty Cash - Branch Float',
    category: 'Asset',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: true,
    description: 'Branch operational immediate cash float.',
  },
  {
    id: 'acc-1100',
    code: '1100',
    name: 'Accounts Receivable (Trade Debtors)',
    category: 'Asset',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: true,
    description: 'Amounts owed by customers from confirmed trade invoices.',
  },
  {
    id: 'acc-1200',
    code: '1200',
    name: 'Merchandise Inventory Asset',
    category: 'Asset',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Valuation of finished goods on hand across warehouses.',
  },
  // Liabilities (2000 - 2999)
  {
    id: 'acc-2000',
    code: '2000',
    name: 'Accounts Payable (Trade Creditors)',
    category: 'Liability',
    normalBalance: 'Credit',
    currentBalance: 0.0,
    isReconcilable: true,
    description: 'Amounts owed to vendors and service contractors.',
  },
  {
    id: 'acc-2100',
    code: '2100',
    name: 'Sales Tax & VAT Payable',
    category: 'Liability',
    normalBalance: 'Credit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Tax collected from customer sales awaiting remittance.',
  },
  // Equity (3000 - 3999)
  {
    id: 'acc-3000',
    code: '3000',
    name: 'Common Stock & Contributed Capital',
    category: 'Equity',
    normalBalance: 'Credit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Invested capital by enterprise owners.',
  },
  {
    id: 'acc-3200',
    code: '3200',
    name: 'Retained Earnings',
    category: 'Equity',
    normalBalance: 'Credit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Cumulative net profit retained from prior fiscal periods.',
  },
  // Revenue (4000 - 4999)
  {
    id: 'acc-4000',
    code: '4000',
    name: 'Product Sales Revenue',
    category: 'Revenue',
    normalBalance: 'Credit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Gross income from completed customer sales orders.',
  },
  {
    id: 'acc-4100',
    code: '4100',
    name: 'Service & Consulting Revenue',
    category: 'Revenue',
    normalBalance: 'Credit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Income from services, installations, and support.',
  },
  // Expenses (5000 - 6999)
  {
    id: 'acc-5000',
    code: '5000',
    name: 'Cost of Goods Sold (COGS)',
    category: 'Expense',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Direct procurement and production cost of items sold.',
  },
  {
    id: 'acc-6100',
    code: '6100',
    name: 'Freight, Logistics & Shipping Expense',
    category: 'Expense',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Courier, transport and handling expenses.',
  },
  {
    id: 'acc-6200',
    code: '6200',
    name: 'Salaries & Operational Overhead',
    category: 'Expense',
    normalBalance: 'Debit',
    currentBalance: 0.0,
    isReconcilable: false,
    description: 'Payroll, facility utilities and operational overhead.',
  },
];

// Clean state: No demo journal entries
export const initialJournalEntries: JournalEntry[] = [];

// System Initialized Audit Record
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-sys-init',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    userId: 'usr-admin',
    userName: 'System Administrator',
    userRole: 'Administrator',
    action: 'Created',
    entityType: 'Company',
    entityId: 'comp-main',
    entityReference: 'INIT-001',
    details: 'System Initialized: Clean production database ready for operations. All demo records removed.',
    ipAddress: '127.0.0.1',
  },
];
