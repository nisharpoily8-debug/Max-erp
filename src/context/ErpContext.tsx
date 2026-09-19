import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Company,
  Branch,
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
  ChartOfAccount,
  JournalEntry,
  AuditLog,
  OfflineQueueItem,
  DeviceViewMode,
  LetterheadConfig,
  DeliveryNote,
  DeliveryNoteStatus,
} from '../types';
import {
  initialCompany,
  initialBranches,
  initialUsers,
  initialWarehouses,
  initialPartners,
  initialProducts,
  initialStockLevels,
  initialStockMovements,
  initialSalesOrders,
  initialDeliveryNotes,
  initialInvoices,
  initialPurchaseOrders,
  initialVendorBills,
  initialPayments,
  initialAccounts,
  initialJournalEntries,
  initialAuditLogs,
} from '../data/mockErpDatabase';

interface ErpContextType {
  company: Company;
  updateCompany: (updates: Partial<Company>) => void;
  updateLetterhead: (updates: Partial<LetterheadConfig>) => void;
  branches: Branch[];
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  setRole: (role: UserRole) => void;

  partners: Partner[];
  products: Product[];
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  stockMovements: StockMovement[];
  salesOrders: SalesOrder[];
  deliveryNotes: DeliveryNote[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  vendorBills: VendorBill[];
  payments: PaymentRecord[];
  accounts: ChartOfAccount[];
  journalEntries: JournalEntry[];
  auditLogs: AuditLog[];

  // Device & Offline State
  deviceViewMode: DeviceViewMode;
  setDeviceViewMode: (mode: DeviceViewMode) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  offlineQueue: OfflineQueueItem[];
  isSyncing: boolean;
  syncOfflineQueue: () => Promise<void>;
  resolveConflict: (queueItemId: string, resolution: 'client_wins' | 'server_wins') => void;

  // Actions
  createSalesOrder: (order: Omit<SalesOrder, 'id' | 'orderNumber'>) => SalesOrder;
  approveSalesOrder: (orderId: string) => boolean;
  createDeliveryNote: (data: Omit<DeliveryNote, 'id' | 'deliveryNoteNumber' | 'createdAt'>) => DeliveryNote;
  updateDeliveryNoteStatus: (id: string, status: DeliveryNoteStatus, receivedBy?: string) => void;
  convertOrderToInvoice: (orderId: string) => Invoice;
  postInvoice: (invoiceId: string) => boolean;
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'receiptNumber'>) => PaymentRecord;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => PurchaseOrder;
  approvePurchaseOrder: (poId: string) => boolean;
  receiveGoods: (poId: string, warehouseId: string) => boolean;
  createVendorBill: (
    bill: Omit<VendorBill, 'id' | 'paidAmount' | 'balanceDue'>,
    options?: {
      autoUpdateStock?: boolean;
      warehouseId?: string;
      autoPostAccounting?: boolean;
      syncPurchaseOrderId?: string;
    }
  ) => VendorBill;
  postVendorBill: (billId: string, warehouseId?: string) => boolean;
  deleteVendorBill: (billId: string) => void;
  adjustStock: (productId: string, warehouseId: string, deltaQty: number, reason: string) => void;
  createJournalEntry: (entry: Omit<JournalEntry, 'id' | 'entryNumber' | 'createdById' | 'createdByName'>) => { success: boolean; error?: string };
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt'>) => Partner;
  updatePartner: (partner: Partner) => void;
  deletePartner: (partnerId: string) => void;
  cleanAllData: (options?: { includeMasterData?: boolean }) => void;
  addProduct: (product: Omit<Product, 'id'>, initialStockByWarehouse?: Record<string, number>) => Product;
  deleteProduct?: (productId: string) => void;
}

const ERP_DB_VERSION = 'v2_clean_production';

function getInitialStorage<T>(key: string, fallback: T): T {
  try {
    const version = localStorage.getItem('erp_database_version');
    if (version !== ERP_DB_VERSION) {
      return fallback;
    }
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed parsing storage for ${key}`, e);
    return fallback;
  }
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear legacy mock database if version upgraded
  useEffect(() => {
    const currentVersion = localStorage.getItem('erp_database_version');
    if (currentVersion !== ERP_DB_VERSION) {
      const legacyKeys = [
        'erp_company_settings',
        'erp_delivery_notes',
        'erp_sales_orders',
        'erp_invoices',
        'erp_purchase_orders',
        'erp_vendor_bills',
        'erp_payments',
        'erp_partners',
        'erp_products',
        'erp_stock_levels',
        'erp_stock_movements',
        'erp_accounts',
        'erp_journal_entries',
        'erp_audit_logs',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('erp_database_version', ERP_DB_VERSION);
    }
  }, []);

  const [company, setCompany] = useState<Company>(() => {
    return getInitialStorage<Company>('erp_company_settings', initialCompany);
  });
  const [branches] = useState<Branch[]>(initialBranches);
  const [currentBranch, setCurrentBranch] = useState<Branch>(initialBranches[0]);
  const [users] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);

  const [partners, setPartners] = useState<Partner[]>(() => {
    return getInitialStorage<Partner[]>('erp_partners', initialPartners);
  });
  const [products, setProducts] = useState<Product[]>(() => {
    return getInitialStorage<Product[]>('erp_products', initialProducts);
  });
  const [warehouses] = useState<Warehouse[]>(initialWarehouses);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>(() => {
    return getInitialStorage<StockLevel[]>('erp_stock_levels', initialStockLevels);
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    return getInitialStorage<StockMovement[]>('erp_stock_movements', initialStockMovements);
  });
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    return getInitialStorage<SalesOrder[]>('erp_sales_orders', initialSalesOrders);
  });
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(() => {
    return getInitialStorage<DeliveryNote[]>('erp_delivery_notes', initialDeliveryNotes);
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return getInitialStorage<Invoice[]>('erp_invoices', initialInvoices);
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    return getInitialStorage<PurchaseOrder[]>('erp_purchase_orders', initialPurchaseOrders);
  });
  const [vendorBills, setVendorBills] = useState<VendorBill[]>(() => {
    return getInitialStorage<VendorBill[]>('erp_vendor_bills', initialVendorBills);
  });
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    return getInitialStorage<PaymentRecord[]>('erp_payments', initialPayments);
  });
  const [accounts, setAccounts] = useState<ChartOfAccount[]>(() => {
    return getInitialStorage<ChartOfAccount[]>('erp_accounts', initialAccounts);
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    return getInitialStorage<JournalEntry[]>('erp_journal_entries', initialJournalEntries);
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return getInitialStorage<AuditLog[]>('erp_audit_logs', initialAuditLogs);
  });

  // Automatically persist all tables to localStorage
  useEffect(() => {
    localStorage.setItem('erp_database_version', ERP_DB_VERSION);
    localStorage.setItem('erp_company_settings', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('erp_partners', JSON.stringify(partners));
  }, [partners]);

  useEffect(() => {
    localStorage.setItem('erp_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('erp_stock_levels', JSON.stringify(stockLevels));
  }, [stockLevels]);

  useEffect(() => {
    localStorage.setItem('erp_stock_movements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem('erp_sales_orders', JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem('erp_delivery_notes', JSON.stringify(deliveryNotes));
  }, [deliveryNotes]);

  useEffect(() => {
    localStorage.setItem('erp_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('erp_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('erp_vendor_bills', JSON.stringify(vendorBills));
  }, [vendorBills]);

  useEffect(() => {
    localStorage.setItem('erp_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('erp_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('erp_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('erp_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const [deviceViewMode, setDeviceViewMode] = useState<DeviceViewMode>('phone');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Switch role convenience
  const setRole = (role: UserRole) => {
    const match = users.find((u) => u.role === role);
    if (match) setCurrentUser(match);
  };

  const addAuditLog = (
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    entityId: string,
    entityReference: string,
    details: string
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      entityReference,
      details,
      ipAddress: '192.168.1.100',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Sync Offline Queue
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    await new Promise((res) => setTimeout(res, 900));

    // Process queued operations
    const newQueue: OfflineQueueItem[] = [];
    for (const item of offlineQueue) {
      if (item.status === 'conflict') {
        newQueue.push(item);
        continue;
      }
      // Successfully synced
      addAuditLog(
        'Synced',
        item.action === 'CREATE_SO'
          ? 'SalesOrder'
          : item.action === 'CREATE_INVOICE'
          ? 'Invoice'
          : 'Stock',
        item.id,
        'OFFLINE-SYNC',
        `Synchronized offline operation ${item.action} successfully with server database.`
      );
    }
    setOfflineQueue(newQueue);
    setIsSyncing(false);
  };

  const resolveConflict = (queueItemId: string, resolution: 'client_wins' | 'server_wins') => {
    setOfflineQueue((prev) =>
      prev.filter((item) => {
        if (item.id === queueItemId) {
          addAuditLog(
            'Synced',
            'Stock',
            queueItemId,
            'CONFLICT-RESOLVED',
            `Resolved conflict for ${item.action} using policy: ${resolution}`
          );
          return false;
        }
        return true;
      })
    );
  };

  // Sales Order Creation
  const createSalesOrder = (orderData: Omit<SalesOrder, 'id' | 'orderNumber'>): SalesOrder => {
    const newOrderNumber = `SO-${new Date().getFullYear()}-${String(salesOrders.length + 105).padStart(3, '0')}`;
    const newId = `so-${Date.now()}`;

    const newOrder: SalesOrder = {
      ...orderData,
      id: newId,
      orderNumber: newOrderNumber,
    };

    if (!isOnline) {
      const queueItem: OfflineQueueItem = {
        id: `queue-${Date.now()}`,
        createdAt: new Date().toISOString(),
        action: 'CREATE_SO',
        payload: newOrder,
        status: 'pending',
        retryCount: 0,
      };
      setOfflineQueue((prev) => [...prev, queueItem]);
    }

    setSalesOrders((prev) => [newOrder, ...prev]);
    addAuditLog('Created', 'SalesOrder', newId, newOrderNumber, `Created Sales Order for ${newOrder.partnerName} ($${newOrder.totalAmount.toFixed(2)})`);

    return newOrder;
  };

  // Approve Sales Order
  const approveSalesOrder = (orderId: string): boolean => {
    if (currentUser.role !== 'Manager' && currentUser.role !== 'Administrator') {
      return false;
    }
    const order = salesOrders.find((o) => o.id === orderId);
    if (!order) return false;

    if (order.totalAmount > currentUser.approvalLimit) {
      return false;
    }

    setSalesOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'Confirmed',
              requiresApproval: false,
              approvedBy: currentUser.name,
              approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : o
      )
    );

    addAuditLog('Approved', 'SalesOrder', order.id, order.orderNumber, `Approved by ${currentUser.name} (Limit: $${currentUser.approvalLimit.toLocaleString()})`);
    return true;
  };

  // Create Delivery Note (Goods Dispatch Note)
  const createDeliveryNote = (
    data: Omit<DeliveryNote, 'id' | 'deliveryNoteNumber' | 'createdAt'>
  ): DeliveryNote => {
    const nextSeq = deliveryNotes.length + 1;
    const deliveryNoteNumber = `DN-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;
    const newNote: DeliveryNote = {
      ...data,
      id: `dn-${Date.now()}`,
      deliveryNoteNumber,
      createdAt: new Date().toISOString(),
    };

    setDeliveryNotes((prev) => [newNote, ...prev]);

    // If linked to a sales order, associate it
    if (data.salesOrderId) {
      setSalesOrders((prev) =>
        prev.map((so) =>
          so.id === data.salesOrderId
            ? { ...so, deliveryNoteId: newNote.id }
            : so
        )
      );
    }

    addAuditLog(
      'Created',
      'DeliveryNote',
      newNote.id,
      newNote.deliveryNoteNumber,
      `Generated Delivery Note ${newNote.deliveryNoteNumber} for order ${newNote.salesOrderNumber} (Carrier: ${newNote.carrierName})`
    );

    return newNote;
  };

  // Update Delivery Note Status (e.g. Dispatched, Delivered, Signed)
  const updateDeliveryNoteStatus = (
    id: string,
    status: DeliveryNoteStatus,
    receivedBy?: string
  ) => {
    setDeliveryNotes((prev) =>
      prev.map((dn) => {
        if (dn.id !== id) return dn;
        const updated: DeliveryNote = {
          ...dn,
          status,
          ...(status === 'Delivered'
            ? {
                actualDeliveryDate: new Date().toISOString().split('T')[0],
                receivedBy: receivedBy || dn.receivedBy || 'Customer Receiving Staff',
                receivedDate: new Date().toLocaleString(),
                signatureReceived: true,
              }
            : {}),
        };
        return updated;
      })
    );

    const note = deliveryNotes.find((n) => n.id === id);
    if (note) {
      addAuditLog(
        'Updated',
        'DeliveryNote',
        id,
        note.deliveryNoteNumber,
        `Status updated to ${status}${receivedBy ? ` (Received by ${receivedBy})` : ''}`
      );

      // If status is Delivered, update the linked sales order
      if (status === 'Delivered' && note.salesOrderId) {
        setSalesOrders((prev) =>
          prev.map((so) =>
            so.id === note.salesOrderId ? { ...so, status: 'Delivered' } : so
          )
        );
      }
    }
  };

  // Convert Sales Order to Invoice
  const convertOrderToInvoice = (orderId: string): Invoice => {
    const order = salesOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const newInvNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 43).padStart(4, '0')}`;
    const invId = `inv-${Date.now()}`;

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: invId,
      invoiceNumber: newInvNumber,
      salesOrderId: order.id,
      partnerId: order.partnerId,
      partnerName: order.partnerName,
      branchId: order.branchId,
      issueDate,
      dueDate,
      status: 'Draft',
      lines: order.lines,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paidAmount: 0,
      balanceDue: order.totalAmount,
      notes: `Generated from order ${order.orderNumber}`,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setSalesOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Invoiced', invoiceId: invId } : o)));

    addAuditLog('Created', 'Invoice', invId, newInvNumber, `Generated Draft Invoice from ${order.orderNumber}`);
    return newInvoice;
  };

  // Post Invoice (Automatic Double-Entry Postings)
  const postInvoice = (invoiceId: string): boolean => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return false;

    // Create Balanced Double-Entry Journal Entry
    // Debit Accounts Receivable (1100) = Total Amount
    // Credit Product Sales Revenue (4000) = Subtotal - Discount
    // Credit Sales Tax Payable (2100) = Tax Amount
    const jeId = `je-inv-${Date.now()}`;
    const jeNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 45).padStart(4, '0')}`;

    const netRevenue = inv.subtotal - inv.discountAmount;

    const newJE: JournalEntry = {
      id: jeId,
      entryNumber: jeNumber,
      journalType: 'Sales',
      date: inv.issueDate,
      reference: inv.invoiceNumber,
      notes: `Automated posting for customer invoice ${inv.invoiceNumber} (${inv.partnerName})`,
      status: 'Posted',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      lines: [
        {
          id: `jel-${Date.now()}-1`,
          accountId: 'acc-1100',
          accountCode: '1100',
          accountName: 'Accounts Receivable (Trade Debtors)',
          description: `Receivable from ${inv.partnerName}`,
          debit: inv.totalAmount,
          credit: 0,
        },
        {
          id: `jel-${Date.now()}-2`,
          accountId: 'acc-4000',
          accountCode: '4000',
          accountName: 'Product Sales Revenue',
          description: `Sales revenue for ${inv.invoiceNumber}`,
          debit: 0,
          credit: netRevenue,
        },
        ...(inv.taxAmount > 0
          ? [
              {
                id: `jel-${Date.now()}-3`,
                accountId: 'acc-2100',
                accountCode: '2100',
                accountName: 'Sales Tax & VAT Payable',
                description: `Sales tax output on ${inv.invoiceNumber}`,
                debit: 0,
                credit: inv.taxAmount,
              },
            ]
          : []),
      ],
      totalDebit: inv.totalAmount,
      totalCredit: inv.totalAmount,
    };

    // Update customer balance (increase receivable)
    setPartners((prev) =>
      prev.map((p) =>
        p.id === inv.partnerId ? { ...p, currentBalance: p.currentBalance + inv.totalAmount } : p
      )
    );

    // Update Chart of Account balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === '1100') return { ...acc, currentBalance: acc.currentBalance + inv.totalAmount };
        if (acc.code === '4000') return { ...acc, currentBalance: acc.currentBalance + netRevenue };
        if (acc.code === '2100') return { ...acc, currentBalance: acc.currentBalance + inv.taxAmount };
        return acc;
      })
    );

    setJournalEntries((prev) => [newJE, ...prev]);

    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, status: 'Posted', journalEntryId: jeId } : i))
    );

    addAuditLog('Posted', 'Invoice', inv.id, inv.invoiceNumber, `Confirmed and posted to General Ledger via ${jeNumber}`);
    return true;
  };

  // Record Payment
  const recordPayment = (paymentData: Omit<PaymentRecord, 'id' | 'receiptNumber'>): PaymentRecord => {
    const newReceipt = `PAY-REC-${new Date().getFullYear()}-${String(payments.length + 15).padStart(4, '0')}`;
    const payId = `pay-${Date.now()}`;

    // Auto Double-Entry:
    // If Customer Receipt:
    // Debit Bank/Cash (1010/1020)
    // Credit Accounts Receivable (1100)
    // If Vendor Payment:
    // Debit Accounts Payable (2000)
    // Credit Bank/Cash (1010/1020)
    const isCustomerReceipt = paymentData.type === 'Customer Receipt';
    const jeId = `je-pay-${Date.now()}`;
    const jeNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 46).padStart(4, '0')}`;

    const newJE: JournalEntry = {
      id: jeId,
      entryNumber: jeNumber,
      journalType: 'Bank',
      date: paymentData.date,
      reference: newReceipt,
      notes: `${paymentData.type}: ${paymentData.partnerName}`,
      status: 'Posted',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      lines: isCustomerReceipt
        ? [
            {
              id: `jel-${Date.now()}-1`,
              accountId: paymentData.bankAccountId,
              accountCode: '1010',
              accountName: 'Operating Bank Account (JPMorgan Chase)',
              description: `Receipt from ${paymentData.partnerName}`,
              debit: paymentData.amount,
              credit: 0,
            },
            {
              id: `jel-${Date.now()}-2`,
              accountId: 'acc-1100',
              accountCode: '1100',
              accountName: 'Accounts Receivable (Trade Debtors)',
              description: `Payment reduction against invoice`,
              debit: 0,
              credit: paymentData.amount,
            },
          ]
        : [
            {
              id: `jel-${Date.now()}-1`,
              accountId: 'acc-2000',
              accountCode: '2000',
              accountName: 'Accounts Payable (Trade Creditors)',
              description: `Liability settlement to ${paymentData.partnerName}`,
              debit: paymentData.amount,
              credit: 0,
            },
            {
              id: `jel-${Date.now()}-2`,
              accountId: paymentData.bankAccountId,
              accountCode: '1010',
              accountName: 'Operating Bank Account (JPMorgan Chase)',
              description: `Disbursement to ${paymentData.partnerName}`,
              debit: 0,
              credit: paymentData.amount,
            },
          ],
      totalDebit: paymentData.amount,
      totalCredit: paymentData.amount,
    };

    const newPayment: PaymentRecord = {
      ...paymentData,
      id: payId,
      receiptNumber: newReceipt,
      journalEntryId: jeId,
    };

    setPayments((prev) => [newPayment, ...prev]);
    setJournalEntries((prev) => [newJE, ...prev]);

    // Update partner balance
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === paymentData.partnerId) {
          return { ...p, currentBalance: Math.max(0, p.currentBalance - paymentData.amount) };
        }
        return p;
      })
    );

    // Update invoice if attached
    if (paymentData.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === paymentData.invoiceId) {
            const newPaid = inv.paidAmount + paymentData.amount;
            const newBal = Math.max(0, inv.totalAmount - newPaid);
            const newStatus = newBal <= 0.01 ? 'Paid' : 'Partially Paid';
            return { ...inv, paidAmount: newPaid, balanceDue: newBal, status: newStatus };
          }
          return inv;
        })
      );
    }

    // Update vendor bill if attached
    if (paymentData.billId) {
      setVendorBills((prev) =>
        prev.map((bill) => {
          if (bill.id === paymentData.billId) {
            const newPaid = bill.paidAmount + paymentData.amount;
            const newBal = Math.max(0, bill.totalAmount - newPaid);
            const newStatus = newBal <= 0.01 ? 'Paid' : 'Partially Paid';
            return { ...bill, paidAmount: newPaid, balanceDue: newBal, status: newStatus };
          }
          return bill;
        })
      );
    }

    addAuditLog('Created', 'Payment', payId, newReceipt, `Recorded payment ${newReceipt} of $${paymentData.amount.toFixed(2)} (${paymentData.type})`);
    return newPayment;
  };

  // Create PO
  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber'>): PurchaseOrder => {
    const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 93).padStart(3, '0')}`;
    const id = `po-${Date.now()}`;

    const newPO: PurchaseOrder = {
      ...poData,
      id,
      poNumber,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    addAuditLog('Created', 'PurchaseOrder', id, poNumber, `Created PO for ${newPO.vendorName} ($${newPO.totalAmount.toFixed(2)})`);
    return newPO;
  };

  // Approve PO
  const approvePurchaseOrder = (poId: string): boolean => {
    if (currentUser.role !== 'Manager' && currentUser.role !== 'Administrator') {
      return false;
    }
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return false;

    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status: 'Ordered', requiresApproval: false, approvedBy: currentUser.name } : p))
    );
    addAuditLog('Approved', 'PurchaseOrder', po.id, po.poNumber, `Approved by ${currentUser.name}`);
    return true;
  };

  // Receive Goods
  const receiveGoods = (poId: string, warehouseId: string): boolean => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return false;

    const warehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];

    // Update stock levels
    po.lines.forEach((line) => {
      setStockLevels((prev) => {
        const existing = prev.find((s) => s.productId === line.productId && s.warehouseId === warehouse.id);
        if (existing) {
          return prev.map((s) =>
            s.productId === line.productId && s.warehouseId === warehouse.id
              ? { ...s, onHand: s.onHand + line.quantity }
              : s
          );
        } else {
          return [...prev, { productId: line.productId, warehouseId: warehouse.id, onHand: line.quantity, reserved: 0, incoming: 0, outgoing: 0 }];
        }
      });

      // Record movement
      const movement: StockMovement = {
        id: `sm-${Date.now()}-${line.productId}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        productId: line.productId,
        productName: line.productName,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        movementType: 'Receipt',
        quantity: line.quantity,
        referenceDocType: 'PO',
        referenceDocId: po.poNumber,
        unitCost: line.unitPrice,
        performedBy: currentUser.name,
        batchNumber: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        notes: `Received from PO ${po.poNumber}`,
      };
      setStockMovements((prev) => [movement, ...prev]);
    });

    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? { ...p, status: 'Goods Received' } : p)));
    addAuditLog('Updated', 'PurchaseOrder', po.id, po.poNumber, `Goods received into ${warehouse.name}`);
    return true;
  };

  // Create & Automatically Ingest Vendor/Purchase Bill
  const createVendorBill = (
    billData: Omit<VendorBill, 'id' | 'paidAmount' | 'balanceDue'>,
    options?: {
      autoUpdateStock?: boolean;
      warehouseId?: string;
      autoPostAccounting?: boolean;
      syncPurchaseOrderId?: string;
    }
  ): VendorBill => {
    const billId = `bill-${Date.now()}`;
    const autoPost = options?.autoPostAccounting !== false;
    const autoStock = options?.autoUpdateStock !== false;
    const targetWarehouse =
      warehouses.find((w) => w.id === (options?.warehouseId || billData.warehouseId)) || warehouses[0];

    let jeId: string | undefined = undefined;

    if (autoPost) {
      // 1. Post to Double-Entry General Ledger
      const jeNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 50).padStart(4, '0')}`;
      jeId = `je-bill-${Date.now()}`;

      const journalLines = [
        {
          id: `jel-${Date.now()}-1`,
          accountId: 'acc-1200',
          accountCode: '1200',
          accountName: 'Merchandise Inventory Asset',
          description: `Inventory Ingestion: ${billData.billNumber} (${billData.vendorName})`,
          debit: billData.subtotal,
          credit: 0,
        },
      ];

      if (billData.taxAmount > 0) {
        journalLines.push({
          id: `jel-${Date.now()}-2`,
          accountId: 'acc-2100',
          accountCode: '2100',
          accountName: 'Sales Tax & VAT Payable (Input Tax Asset/Offset)',
          description: `Input VAT / Tax on ${billData.billNumber}`,
          debit: billData.taxAmount,
          credit: 0,
        });
      }

      journalLines.push({
        id: `jel-${Date.now()}-3`,
        accountId: 'acc-2000',
        accountCode: '2000',
        accountName: 'Accounts Payable (Trade Creditors)',
        description: `Payable liability to ${billData.vendorName}`,
        debit: 0,
        credit: billData.totalAmount,
      });

      const newJE: JournalEntry = {
        id: jeId,
        entryNumber: jeNumber,
        journalType: 'Purchases',
        date: billData.billDate,
        reference: billData.billNumber,
        notes: `Vendor Bill: ${billData.vendorName} • Scanned ${billData.scannedFileType?.toUpperCase() || 'Document'}`,
        status: 'Posted',
        createdById: currentUser.id,
        createdByName: currentUser.name,
        lines: journalLines,
        totalDebit: billData.totalAmount,
        totalCredit: billData.totalAmount,
      };

      setJournalEntries((prev) => [newJE, ...prev]);

      // Update Chart of Account balances
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.code === '1200') return { ...acc, currentBalance: acc.currentBalance + billData.subtotal };
          if (acc.code === '2000') return { ...acc, currentBalance: acc.currentBalance + billData.totalAmount };
          if (acc.code === '2100') return { ...acc, currentBalance: acc.currentBalance - billData.taxAmount };
          return acc;
        })
      );

      // Update Vendor liability balance in Partners
      setPartners((prev) =>
        prev.map((p) =>
          p.id === billData.vendorId ? { ...p, currentBalance: p.currentBalance + billData.totalAmount } : p
        )
      );
    }

    // 2. Auto-Update Inventory / Stock Levels & Stock Movements
    if (autoStock && targetWarehouse) {
      billData.lines.forEach((line) => {
        setStockLevels((prev) => {
          const match = prev.find((s) => s.productId === line.productId && s.warehouseId === targetWarehouse.id);
          if (match) {
            return prev.map((s) =>
              s.productId === line.productId && s.warehouseId === targetWarehouse.id
                ? { ...s, onHand: s.onHand + line.quantity }
                : s
            );
          } else {
            return [
              ...prev,
              {
                productId: line.productId,
                warehouseId: targetWarehouse.id,
                onHand: line.quantity,
                reserved: 0,
                incoming: 0,
                outgoing: 0,
              },
            ];
          }
        });

        const movement: StockMovement = {
          id: `sm-${Date.now()}-${line.productId}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          productId: line.productId,
          productName: line.productName,
          warehouseId: targetWarehouse.id,
          warehouseName: targetWarehouse.name,
          movementType: 'Receipt',
          quantity: line.quantity,
          referenceDocType: 'PO',
          referenceDocId: billData.billNumber,
          unitCost: line.unitPrice,
          performedBy: currentUser.name,
          batchNumber: `BILL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          notes: `Auto-ingested from Purchase Bill Scanner (${billData.scannedFileName || billData.billNumber})`,
        };
        setStockMovements((prev) => [movement, ...prev]);
      });
    }

    // 3. Sync Linked Purchase Order
    const poToSync = options?.syncPurchaseOrderId || billData.purchaseOrderId;
    if (poToSync) {
      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.id === poToSync || p.poNumber === poToSync
            ? { ...p, status: 'Billed', billId: billId }
            : p
        )
      );
    }

    const newBill: VendorBill = {
      ...billData,
      id: billId,
      status: autoPost ? 'Posted' : 'Draft',
      paidAmount: 0,
      balanceDue: billData.totalAmount,
      journalEntryId: jeId,
      warehouseId: targetWarehouse?.id,
    };

    setVendorBills((prev) => [newBill, ...prev]);

    addAuditLog(
      'Created',
      'VendorBill',
      newBill.id,
      newBill.billNumber,
      `Scanned purchase bill ${newBill.billNumber} from ${newBill.vendorName} ($${newBill.totalAmount.toFixed(2)}) auto-processed into Ledger & Warehouse ${targetWarehouse?.name || ''}`
    );

    return newBill;
  };

  // Post Draft Vendor Bill
  const postVendorBill = (billId: string, warehouseId?: string): boolean => {
    const bill = vendorBills.find((b) => b.id === billId);
    if (!bill || bill.status === 'Posted') return false;

    const jeNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 50).padStart(4, '0')}`;
    const jeId = `je-bill-${Date.now()}`;

    const journalLines = [
      {
        id: `jel-${Date.now()}-1`,
        accountId: 'acc-1200',
        accountCode: '1200',
        accountName: 'Merchandise Inventory Asset',
        description: `Inventory Ingestion: ${bill.billNumber} (${bill.vendorName})`,
        debit: bill.subtotal,
        credit: 0,
      },
    ];

    if (bill.taxAmount > 0) {
      journalLines.push({
        id: `jel-${Date.now()}-2`,
        accountId: 'acc-2100',
        accountCode: '2100',
        accountName: 'Sales Tax & VAT Payable',
        description: `Input VAT / Tax on ${bill.billNumber}`,
        debit: bill.taxAmount,
        credit: 0,
      });
    }

    journalLines.push({
      id: `jel-${Date.now()}-3`,
      accountId: 'acc-2000',
      accountCode: '2000',
      accountName: 'Accounts Payable (Trade Creditors)',
      description: `Payable liability to ${bill.vendorName}`,
      debit: 0,
      credit: bill.totalAmount,
    });

    const newJE: JournalEntry = {
      id: jeId,
      entryNumber: jeNumber,
      journalType: 'Purchases',
      date: bill.billDate,
      reference: bill.billNumber,
      notes: `Vendor Bill: ${bill.vendorName}`,
      status: 'Posted',
      createdById: currentUser.id,
      createdByName: currentUser.name,
      lines: journalLines,
      totalDebit: bill.totalAmount,
      totalCredit: bill.totalAmount,
    };

    setJournalEntries((prev) => [newJE, ...prev]);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.code === '1200') return { ...acc, currentBalance: acc.currentBalance + bill.subtotal };
        if (acc.code === '2000') return { ...acc, currentBalance: acc.currentBalance + bill.totalAmount };
        if (acc.code === '2100') return { ...acc, currentBalance: acc.currentBalance - bill.taxAmount };
        return acc;
      })
    );

    setPartners((prev) =>
      prev.map((p) =>
        p.id === bill.vendorId ? { ...p, currentBalance: p.currentBalance + bill.totalAmount } : p
      )
    );

    setVendorBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'Posted', journalEntryId: jeId } : b))
    );

    addAuditLog('Posted', 'VendorBill', bill.id, bill.billNumber, `Posted vendor bill to General Ledger via ${jeNumber}`);
    return true;
  };

  const deleteVendorBill = (billId: string) => {
    const bill = vendorBills.find((b) => b.id === billId);
    if (!bill) return;
    setVendorBills((prev) => prev.filter((b) => b.id !== billId));
    addAuditLog('Deleted', 'VendorBill', bill.id, bill.billNumber, `Deleted vendor bill ${bill.billNumber}`);
  };

  // Adjust Stock
  const adjustStock = (productId: string, warehouseId: string, deltaQty: number, reason: string) => {
    const product = products.find((p) => p.id === productId);
    const warehouse = warehouses.find((w) => w.id === warehouseId) || warehouses[0];
    if (!product) return;

    setStockLevels((prev) => {
      const match = prev.find((s) => s.productId === productId && s.warehouseId === warehouse.id);
      if (match) {
        return prev.map((s) =>
          s.productId === productId && s.warehouseId === warehouse.id
            ? { ...s, onHand: Math.max(0, s.onHand + deltaQty) }
            : s
        );
      } else {
        return [...prev, { productId, warehouseId: warehouse.id, onHand: Math.max(0, deltaQty), reserved: 0, incoming: 0, outgoing: 0 }];
      }
    });

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      productId,
      productName: product.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      movementType: deltaQty < 0 ? 'Adjustment' : 'Receipt',
      quantity: deltaQty,
      referenceDocType: 'Stock Count',
      referenceDocId: `ADJ-${Date.now().toString().slice(-4)}`,
      unitCost: product.purchasePrice,
      performedBy: currentUser.name,
      notes: reason,
    };

    setStockMovements((prev) => [movement, ...prev]);
    addAuditLog('Updated', 'Stock', product.id, product.code, `Manual stock adjustment of ${deltaQty > 0 ? '+' : ''}${deltaQty} (${reason})`);
  };

  // Create Manual Balanced Journal Entry
  const createJournalEntry = (
    entryData: Omit<JournalEntry, 'id' | 'entryNumber' | 'createdById' | 'createdByName'>
  ): { success: boolean; error?: string } => {
    const diff = Math.abs(entryData.totalDebit - entryData.totalCredit);
    if (diff > 0.009) {
      return {
        success: false,
        error: `Financial Integrity Violation: Total Debits ($${entryData.totalDebit.toFixed(2)}) must equal Total Credits ($${entryData.totalCredit.toFixed(2)}). Difference is $${diff.toFixed(2)}.`,
      };
    }

    const jeNumber = `JE-${new Date().getFullYear()}-${String(journalEntries.length + 46).padStart(4, '0')}`;
    const id = `je-${Date.now()}`;

    const newJE: JournalEntry = {
      ...entryData,
      id,
      entryNumber: jeNumber,
      createdById: currentUser.id,
      createdByName: currentUser.name,
    };

    setJournalEntries((prev) => [newJE, ...prev]);

    // Update account balances
    entryData.lines.forEach((line) => {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === line.accountId) {
            const netChange = acc.normalBalance === 'Debit' ? line.debit - line.credit : line.credit - line.debit;
            return { ...acc, currentBalance: acc.currentBalance + netChange };
          }
          return acc;
        })
      );
    });

    addAuditLog('Created', 'JournalEntry', id, jeNumber, `Manual balanced journal entry (${entryData.journalType}): $${entryData.totalDebit.toFixed(2)}`);
    return { success: true };
  };

  const addPartner = (partnerData: Omit<Partner, 'id' | 'createdAt'>): Partner => {
    const id = `part-${Date.now()}`;
    const newPartner: Partner = {
      ...partnerData,
      id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPartners((prev) => [newPartner, ...prev]);
    addAuditLog('Created', 'Partner', id, newPartner.name, `Added new ${newPartner.type}: ${newPartner.name}`);
    return newPartner;
  };

  const updatePartner = (updated: Partner) => {
    setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    addAuditLog('Updated', 'Partner', updated.id, updated.name, `Updated ${updated.type} information: ${updated.name}`);
  };

  const deletePartner = (partnerId: string) => {
    const target = partners.find((p) => p.id === partnerId);
    setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    if (target) {
      addAuditLog('Deleted', 'Partner', target.id, target.name, `Removed ${target.type}: ${target.name}`);
    }
  };

  const cleanAllData = (options?: { includeMasterData?: boolean }) => {
    setSalesOrders([]);
    setDeliveryNotes([]);
    setInvoices([]);
    setPurchaseOrders([]);
    setVendorBills([]);
    setPayments([]);
    setStockMovements([]);
    setJournalEntries([]);
    setOfflineQueue([]);

    if (options?.includeMasterData) {
      setPartners([]);
      setProducts([]);
      setStockLevels([]);
    } else {
      // Zero out onHand, reserved, incoming, outgoing
      setStockLevels((prev) => prev.map((sl) => ({ ...sl, onHand: 0, reserved: 0, incoming: 0, outgoing: 0 })));
      // Reset partner balances to 0
      setPartners((prev) => prev.map((p) => ({ ...p, currentBalance: 0 })));
    }

    setAccounts(initialAccounts.map((a) => ({ ...a, currentBalance: 0.0 })));

    addAuditLog(
      'Deleted',
      'Company',
      company.id,
      'CLEAN-SLATE',
      'Database purged: All demo transactions cleaned and system reset to pristine production state.'
    );
  };

  const addProduct = (
    prodData: Omit<Product, 'id'>,
    initialStockByWarehouse?: Record<string, number>
  ): Product => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...prodData,
      id,
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Create initial stock level record for all warehouses
    warehouses.forEach((wh) => {
      const initialQty = Math.max(0, initialStockByWarehouse?.[wh.id] || 0);
      setStockLevels((prev) => [
        ...prev,
        {
          productId: id,
          warehouseId: wh.id,
          onHand: initialQty,
          reserved: 0,
          incoming: 0,
          outgoing: 0,
        },
      ]);

      if (initialQty > 0) {
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${wh.id}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          productId: id,
          productName: newProduct.name,
          warehouseId: wh.id,
          warehouseName: wh.name,
          movementType: 'Receipt',
          quantity: initialQty,
          referenceDocType: 'Manual',
          referenceDocId: `INIT-${newProduct.code}`,
          unitCost: newProduct.purchasePrice,
          performedBy: currentUser.name,
          notes: `Initial opening inventory stock entry for ${newProduct.name}`,
        };
        setStockMovements((prev) => [movement, ...prev]);
        addAuditLog(
          'Created',
          'Stock',
          id,
          newProduct.code,
          `Opening stock of ${initialQty} ${newProduct.unit} recorded in ${wh.name}`
        );
      }
    });

    addAuditLog(
      'Created',
      'Stock',
      id,
      newProduct.code,
      `Manually registered product ${newProduct.name} (${newProduct.code}) - Cost: $${newProduct.purchasePrice.toFixed(2)}, Sell: $${newProduct.sellingPrice.toFixed(2)}`
    );
    return newProduct;
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setStockLevels((prev) => prev.filter((sl) => sl.productId !== productId));
    if (target) {
      addAuditLog('Deleted', 'Stock', target.id, target.code, `Removed product master: ${target.name}`);
    }
  };

  const updateCompany = (updates: Partial<Company>) => {
    setCompany((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('erp_company_settings', JSON.stringify(next));
      addAuditLog('Updated', 'Company', prev.id, prev.name, 'Updated company profile details');
      return next;
    });
  };

  const updateLetterhead = (updates: Partial<LetterheadConfig>) => {
    setCompany((prev) => {
      const currentLetterhead = prev.letterhead || {
        showLogo: true,
        logoType: 'preset',
        presetId: 'diamond',
        logoHeight: 48,
        layout: 'split',
        showCompanyDetails: true,
      };
      const next: Company = {
        ...prev,
        letterhead: {
          ...currentLetterhead,
          ...updates,
        },
      };
      localStorage.setItem('erp_company_settings', JSON.stringify(next));
      addAuditLog('Updated', 'Company', prev.id, prev.name, 'Updated document letterhead & logo settings');
      return next;
    });
  };

  return (
    <ErpContext.Provider
      value={{
        company,
        updateCompany,
        updateLetterhead,
        branches,
        currentBranch,
        setCurrentBranch,
        users,
        currentUser,
        setCurrentUser,
        setRole,
        partners,
        products,
        warehouses,
        stockLevels,
        stockMovements,
        salesOrders,
        deliveryNotes,
        invoices,
        purchaseOrders,
        vendorBills,
        payments,
        accounts,
        journalEntries,
        auditLogs,
        deviceViewMode,
        setDeviceViewMode,
        isOnline,
        setIsOnline,
        offlineQueue,
        isSyncing,
        syncOfflineQueue,
        resolveConflict,
        createSalesOrder,
        approveSalesOrder,
        createDeliveryNote,
        updateDeliveryNoteStatus,
        convertOrderToInvoice,
        postInvoice,
        recordPayment,
        createPurchaseOrder,
        approvePurchaseOrder,
        receiveGoods,
        createVendorBill,
        postVendorBill,
        deleteVendorBill,
        adjustStock,
        createJournalEntry,
        addPartner,
        updatePartner,
        deletePartner,
        cleanAllData,
        addProduct,
        deleteProduct,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) throw new Error('useErp must be used within an ErpProvider');
  return context;
};
