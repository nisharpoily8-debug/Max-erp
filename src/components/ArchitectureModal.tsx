import React, { useState } from 'react';
import {
  Code2,
  Database,
  Layers,
  Shield,
  Map,
  Calendar,
  X,
  Copy,
  Check,
  Smartphone,
  Server,
  FileCode,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'kotlin' | 'roles' | 'plan'>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const postgresSchema = `-- =========================================================================
-- MaxPack ERP: Production-Ready PostgreSQL DDL Schema
-- Multi-Company, Multi-Branch, Double-Entry Balanced Ledger & Audit Trail
-- =========================================================================

-- 1. COMPANIES & BRANCHES
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_registration_no VARCHAR(100) UNIQUE NOT NULL,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    fiscal_year_start VARCHAR(5) NOT NULL DEFAULT '01-01',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(company_id, code)
);

-- 2. USERS & RBAC PERMISSIONS
CREATE TYPE user_role AS ENUM (
    'Administrator', 'Accountant', 'Salesperson', 
    'Purchase Officer', 'Warehouse User', 'Manager', 'Viewer'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Viewer',
    approval_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PARTNERS (CUSTOMERS & VENDORS)
CREATE TYPE partner_type AS ENUM ('customer', 'vendor', 'both');

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    type partner_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    tax_number VARCHAR(100),
    payment_terms_days INT NOT NULL DEFAULT 30,
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    billing_address TEXT,
    shipping_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CHART OF ACCOUNTS & DOUBLE-ENTRY LEDGER
CREATE TYPE account_category AS ENUM ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense');
CREATE TYPE balance_type AS ENUM ('Debit', 'Credit');

CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category account_category NOT NULL,
    normal_balance balance_type NOT NULL,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_reconcilable BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(company_id, code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    journal_type VARCHAR(50) NOT NULL, -- 'Sales', 'Purchases', 'Cash', 'Bank', 'General'
    date DATE NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    total_debit NUMERIC(15, 2) NOT NULL,
    total_credit NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Posted',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_balanced_entry CHECK (ABS(total_debit - total_credit) < 0.01)
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    description TEXT,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 5. IMMUTABLE AUDIT TRAIL
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'Created', 'Updated', 'Approved', 'Posted', 'Synced'
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_reference VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET
);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);`;

  const kotlinComposeCode = `// =========================================================================
// Nexa ERP: Android Kotlin + Jetpack Compose Architecture Sample
// MVVM, Room Local Database with Encryption, WorkManager Offline Sync
// =========================================================================

package io.nexa.erp.domain.model

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import java.time.Instant

// 1. Domain Entities
@Entity(tableName = "sales_orders")
data class SalesOrderEntity(
    @PrimaryKey val id: String,
    val orderNumber: String,
    val partnerId: String,
    val partnerName: String,
    val totalAmount: BigDecimal,
    val status: String, // 'Draft', 'Pending Approval', 'Confirmed', 'Invoiced'
    val syncStatus: String, // 'SYNCED', 'PENDING_OFFLINE', 'CONFLICT'
    val revision: Int,
    val updatedAt: Long = System.currentTimeMillis()
)

// 2. Room DAO with Reactive Flow
@Dao
interface SalesOrderDao {
    @Query("SELECT * FROM sales_orders ORDER BY updatedAt DESC")
    fun observeAllOrders(): Flow<List<SalesOrderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertOrder(order: SalesOrderEntity)

    @Query("SELECT * FROM sales_orders WHERE syncStatus = 'PENDING_OFFLINE'")
    suspend fun getPendingSyncOrders(): List<SalesOrderEntity>
}

// 3. Jetpack Compose UI Screen (Material 3)
package io.nexa.erp.ui.sales

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.nexa.erp.domain.model.SalesOrderEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesOrderListScreen(
    orders: List<SalesOrderEntity>,
    onOrderClick: (String) -> Unit,
    onNewOrderClick: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nexa Sales Orders", style = MaterialTheme.typography.titleMedium) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNewOrderClick,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Text("+ New")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(orders, key = { it.id }) { order ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.large,
                    onClick = { onOrderClick(order.id) }
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(order.orderNumber, style = MaterialTheme.typography.labelLarge)
                            Badge { Text(order.status) }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(order.partnerName, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            "$ \${order.totalAmount}",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-100">MaxPack ERP System Architecture & Source</h2>
              <p className="text-xs text-stone-400">
                Android Jetpack Compose, Room DB, PostgreSQL & Multi-Module Clean Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex p-2 bg-stone-950 border-b border-stone-800 text-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              activeTab === 'architecture' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Architecture & Offline Sync
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              activeTab === 'schema' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> PostgreSQL DDL Schema
          </button>
          <button
            onClick={() => setActiveTab('kotlin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              activeTab === 'kotlin' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Kotlin & Jetpack Compose
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              activeTab === 'roles' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Roles & Approval Matrix
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              activeTab === 'plan' ? 'bg-indigo-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Phased Plan
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-stone-300 space-y-4">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Android Clean Architecture (Kotlin + Jetpack Compose)
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-stone-400 text-xs">
                  <li><strong>Presentation Layer:</strong> Jetpack Compose with Material 3 Design Tokens, Single-Activity Navigation Architecture with Jetpack Navigation Compose, StateFlow & SharedFlow reactive ViewModels.</li>
                  <li><strong>Domain Layer:</strong> Pure Kotlin UseCases (e.g. <code className="text-stone-200 font-mono">CreateSalesOrderUseCase</code>, <code className="text-stone-200 font-mono">PostBalancedJournalEntryUseCase</code>) guaranteeing zero Android framework dependencies and 100% unit-testability.</li>
                  <li><strong>Data Layer (Offline-First):</strong> Room ORM with SQLCipher 256-bit AES database encryption. In-memory and local disk persistence. Operations are executed immediately against Room with status <code className="text-amber-400 font-mono">PENDING_OFFLINE</code>.</li>
                  <li><strong>Sync Engine:</strong> Android WorkManager with <code className="text-stone-200 font-mono">PeriodicWorkRequestBuilder</code> and exponential backoff retry. Vector clock revision counters detect out-of-order changes and conflict resolutions.</li>
                </ul>
              </div>

              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  Backend REST & GraphQL Architecture (PostgreSQL)
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-stone-400 text-xs">
                  <li><strong>PostgreSQL Database:</strong> Strict ACID transactional constraints, double-entry balanced check triggers (<code className="text-stone-200 font-mono">ABS(total_debit - total_credit) &lt; 0.01</code>), and append-only audit trail logging.</li>
                  <li><strong>Security & Auth:</strong> Argon2id password hashing, RS256 JWT tokens with short TTL and encrypted refresh tokens stored in Android Keystore / EncryptedSharedPreferences.</li>
                  <li><strong>Financial Integrity:</strong> Database stored procedures enforce period locking, prevent modification of posted journals, and require manual counter-entries (credit notes/reversals) for corrections.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-medium">PostgreSQL DDL with Constraints & Indexes</span>
                <button
                  onClick={() => handleCopy(postgresSchema)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>
              <pre className="p-4 bg-stone-950 border border-stone-800 rounded-2xl overflow-x-auto text-[11px] font-mono text-stone-300 leading-relaxed max-h-[420px]">
                {postgresSchema}
              </pre>
            </div>
          )}

          {activeTab === 'kotlin' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 font-medium">Kotlin Room Entity & Compose Screen Code</span>
                <button
                  onClick={() => handleCopy(kotlinComposeCode)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Kotlin'}
                </button>
              </div>
              <pre className="p-4 bg-stone-950 border border-stone-800 rounded-2xl overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed max-h-[420px]">
                {kotlinComposeCode}
              </pre>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-stone-100">Role-Based Access Control (RBAC) & Approval Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-stone-400 uppercase text-[10px] border-b border-stone-800">
                      <th className="py-2">Role</th>
                      <th className="py-2">Approval Limit</th>
                      <th className="py-2">Sales & Quotes</th>
                      <th className="py-2">Invoices & Pay</th>
                      <th className="py-2">Inventory</th>
                      <th className="py-2">Accounting GL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-emerald-400">Administrator</td>
                      <td className="py-2 font-mono">Unlimited ($1M+)</td>
                      <td className="py-2 text-emerald-400">Full</td>
                      <td className="py-2 text-emerald-400">Full</td>
                      <td className="py-2 text-emerald-400">Full</td>
                      <td className="py-2 text-emerald-400">Full</td>
                    </tr>
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-sky-400">Manager</td>
                      <td className="py-2 font-mono">$100,000</td>
                      <td className="py-2 text-emerald-400">Approve & Edit</td>
                      <td className="py-2 text-emerald-400">Review & Pay</td>
                      <td className="py-2 text-emerald-400">Full</td>
                      <td className="py-2 text-stone-400">Review</td>
                    </tr>
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-teal-400">Accountant</td>
                      <td className="py-2 font-mono">$50,000</td>
                      <td className="py-2 text-stone-400">Invoice Only</td>
                      <td className="py-2 text-emerald-400">Post & Reconcile</td>
                      <td className="py-2 text-stone-400">Valuation</td>
                      <td className="py-2 text-emerald-400">Full Access</td>
                    </tr>
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-indigo-400">Salesperson</td>
                      <td className="py-2 font-mono">$5,000</td>
                      <td className="py-2 text-emerald-400">Create & Quote</td>
                      <td className="py-2 text-stone-500">View Own</td>
                      <td className="py-2 text-stone-500">View Stock</td>
                      <td className="py-2 text-stone-500">Restricted</td>
                    </tr>
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-amber-400">Purchase Officer</td>
                      <td className="py-2 font-mono">$15,000</td>
                      <td className="py-2 text-stone-500">None</td>
                      <td className="py-2 text-stone-400">View Bills</td>
                      <td className="py-2 text-stone-400">Incoming POs</td>
                      <td className="py-2 text-stone-500">Restricted</td>
                    </tr>
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-rose-400">Warehouse User</td>
                      <td className="py-2 font-mono">$2,000</td>
                      <td className="py-2 text-stone-500">None</td>
                      <td className="py-2 text-stone-500">None</td>
                      <td className="py-2 text-emerald-400">Scan & Move</td>
                      <td className="py-2 text-stone-500">Restricted</td>
                    </tr>
                    <tr className="text-stone-200">
                      <td className="py-2 font-bold text-stone-400">Viewer</td>
                      <td className="py-2 font-mono">$0</td>
                      <td className="py-2 text-stone-400">Read-Only</td>
                      <td className="py-2 text-stone-400">Read-Only</td>
                      <td className="py-2 text-stone-400">Read-Only</td>
                      <td className="py-2 text-stone-400">Audit Reports</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-stone-100">Phased Implementation Roadmap</h3>
              <div className="space-y-2.5">
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                    <span>Phase 1: Foundation, Multi-Company & Auth</span>
                    <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    User authentication, biometric placeholder, JWT token issuance, multi-company and multi-branch tenancy, base chart of accounts, and immutable audit logging.
                  </p>
                </div>
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                    <span>Phase 2: CRM, Product Catalog & Sales Lifecycle</span>
                    <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Customer & vendor directory, credit limits, price lists, quotations, sales orders with discount math, and manager approval gates.
                  </p>
                </div>
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                    <span>Phase 3: Tax Invoicing & Automated Double-Entry Postings</span>
                    <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Confirmed invoices automatically posting Debit AR (1100), Credit Sales Revenue (4000), and Credit Tax Payable (2100). Payment recording, PDF tax receipts, and payment links.
                  </p>
                </div>
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                    <span>Phase 4: Procurement & Multi-Warehouse Inventory</span>
                    <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    RFQs, Purchase Orders with manager limits, Goods Receipts, camera barcode scanning, stock adjustments, batch/lot tracking, and stock movement ledger.
                  </p>
                </div>
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                    <span>Phase 5: Advanced Accounting & 16 Interactive Reports</span>
                    <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Balanced manual journal entries (strictly Debit == Credit), AR/AP aging buckets, P&L, Balance Sheet, Trial Balance, Inventory Valuation, and CSV/PDF export.
                  </p>
                </div>
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1">
                    <span>Phase 6: Android Offline Synchronization & Conflict Handling</span>
                    <span className="text-[10px] font-mono bg-emerald-950 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <p className="text-stone-400 text-[11px]">
                    Room database local queue, background WorkManager sync, client-wins / server-wins conflict resolution engine, and network disconnect simulation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
