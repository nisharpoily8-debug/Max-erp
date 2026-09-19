import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  UserCheck,
  Search,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  DollarSign,
  Briefcase,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { Partner } from '../types';

interface PartnersScreenProps {
  initialFilter?: 'all' | 'customer' | 'vendor';
  onNavigate?: (tab: any) => void;
}

export const PartnersScreen: React.FC<PartnersScreenProps> = ({
  initialFilter = 'all',
  onNavigate,
}) => {
  const { partners, addPartner, updatePartner, deletePartner } = useErp();
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<'all' | 'customer' | 'vendor'>(initialFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync initialFilter prop if changed
  useEffect(() => {
    if (initialFilter) {
      setPartnerTypeFilter(initialFilter);
    }
  }, [initialFilter]);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  // Form Fields
  const [type, setType] = useState<'customer' | 'vendor' | 'both'>('customer');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState(30);
  const [creditLimit, setCreditLimit] = useState(25000);
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [notes, setNotes] = useState('');

  const customerCount = partners.filter((p) => p.type === 'customer' || p.type === 'both').length;
  const vendorCount = partners.filter((p) => p.type === 'vendor' || p.type === 'both').length;

  // Open modal in create mode
  const handleOpenCreate = (defaultType: 'customer' | 'vendor' | 'both') => {
    setEditingPartner(null);
    setType(defaultType);
    setName('');
    setCompanyName('');
    setContactPerson('');
    setCategory(defaultType === 'customer' ? 'Enterprise' : 'Component Supplier');
    setEmail('');
    setPhone('');
    setTaxNumber('');
    setPaymentTermsDays(30);
    setCreditLimit(defaultType === 'customer' ? 50000 : 0);
    setBillingAddress('');
    setShippingAddress('');
    setBankDetails('');
    setNotes('');
    setIsFormModalOpen(true);
  };

  // Open modal in edit mode
  const handleOpenEdit = (p: Partner) => {
    setEditingPartner(p);
    setType(p.type);
    setName(p.name);
    setCompanyName(p.companyName || '');
    setContactPerson(p.contactPerson || '');
    setCategory(p.category || '');
    setEmail(p.email);
    setPhone(p.phone);
    setTaxNumber(p.taxNumber);
    setPaymentTermsDays(p.paymentTermsDays);
    setCreditLimit(p.creditLimit);
    setBillingAddress(p.billingAddress);
    setShippingAddress(p.shippingAddress);
    setBankDetails(p.bankDetails || '');
    setNotes(p.notes || '');
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingPartner) {
      updatePartner({
        ...editingPartner,
        type,
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        category: category.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        taxNumber: taxNumber.trim() || 'TAX-EXEMPT',
        paymentTermsDays: Number(paymentTermsDays) || 30,
        creditLimit: Number(creditLimit) || 0,
        billingAddress: billingAddress.trim() || 'Default Address',
        shippingAddress: shippingAddress.trim() || billingAddress.trim() || 'Default Address',
        bankDetails: bankDetails.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addPartner({
        type,
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        category: category.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        taxNumber: taxNumber.trim() || 'TAX-EXEMPT',
        paymentTermsDays: Number(paymentTermsDays) || 30,
        creditLimit: Number(creditLimit) || 0,
        currentBalance: 0,
        currency: 'USD',
        billingAddress: billingAddress.trim() || 'Default Address',
        shippingAddress: shippingAddress.trim() || billingAddress.trim() || 'Default Address',
        bankDetails: bankDetails.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (partnerToDelete) {
      deletePartner(partnerToDelete.id);
      setPartnerToDelete(null);
    }
  };

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    const matchesType =
      partnerTypeFilter === 'all' ||
      p.type === partnerTypeFilter ||
      p.type === 'both';

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.companyName && p.companyName.toLowerCase().includes(q)) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
      p.taxNumber.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.includes(q);

    return matchesType && matchesCategory && matchesSearch;
  });

  const categories = Array.from(
    new Set(partners.map((p) => p.category).filter(Boolean))
  ) as string[];

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-3xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            {partnerTypeFilter === 'customer' ? (
              <Users className="w-5 h-5 text-sky-400" />
            ) : partnerTypeFilter === 'vendor' ? (
              <Building2 className="w-5 h-5 text-amber-400" />
            ) : (
              <Briefcase className="w-5 h-5 text-emerald-400" />
            )}
            <h2 className="text-base font-bold text-stone-100">
              {partnerTypeFilter === 'customer'
                ? 'Customer Accounts'
                : partnerTypeFilter === 'vendor'
                ? 'Vendor & Supplier Registry'
                : 'Customer & Vendor Directory'}
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {partnerTypeFilter === 'customer'
              ? `Manage clients, credit limits, contact persons & payment terms (${customerCount} total)`
              : partnerTypeFilter === 'vendor'
              ? `Manage suppliers, bank details, purchasing terms & invoices (${vendorCount} total)`
              : `Connected directory for buyers and suppliers (${partners.length} total)`}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {(partnerTypeFilter === 'all' || partnerTypeFilter === 'customer') && (
            <button
              onClick={() => handleOpenCreate('customer')}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-950 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}

          {(partnerTypeFilter === 'all' || partnerTypeFilter === 'vendor') && (
            <button
              onClick={() => handleOpenCreate('vendor')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex p-1 bg-stone-900 border border-stone-800 rounded-2xl text-xs">
          <button
            onClick={() => setPartnerTypeFilter('all')}
            className={`flex-1 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 ${
              partnerTypeFilter === 'all'
                ? 'bg-stone-800 text-emerald-400 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>All Directory</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-stone-950/60 rounded-full">
              {partners.length}
            </span>
          </button>
          <button
            onClick={() => setPartnerTypeFilter('customer')}
            className={`flex-1 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 ${
              partnerTypeFilter === 'customer'
                ? 'bg-stone-800 text-sky-400 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-stone-950/60 rounded-full">
              {customerCount}
            </span>
          </button>
          <button
            onClick={() => setPartnerTypeFilter('vendor')}
            className={`flex-1 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 ${
              partnerTypeFilter === 'vendor'
                ? 'bg-stone-800 text-amber-400 shadow-xs'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Vendors</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-stone-950/60 rounded-full">
              {vendorCount}
            </span>
          </button>
        </div>

        {/* Search & Category row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, contact person, tax ID, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Empty State when 0 partners exist */}
      {filteredPartners.length === 0 && (
        <div className="p-8 bg-stone-900/50 border border-stone-800 rounded-3xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-stone-800 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <Users className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-stone-100">
              {searchQuery
                ? 'No partners found matching your search'
                : partnerTypeFilter === 'customer'
                ? 'No Customers Registered Yet'
                : partnerTypeFilter === 'vendor'
                ? 'No Vendors Registered Yet'
                : 'Pristine Production State: Directory Empty'}
            </h3>
            <p className="text-xs text-stone-400">
              {searchQuery
                ? 'Try a different search term or reset the active filter tab.'
                : 'Your demo data has been cleaned. Register your real clients and suppliers to start tracking quotations, sales orders, invoices, and purchase receipts.'}
            </p>
          </div>

          {!searchQuery && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
              <button
                onClick={() => handleOpenCreate('customer')}
                className="flex flex-col items-center p-4 bg-sky-950/30 border border-sky-600/30 hover:border-sky-500/60 rounded-2xl transition group text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-sky-300">+ Register Customer</span>
                <span className="text-[11px] text-stone-400 mt-0.5 text-center">
                  Add clients to issue sales quotations & invoices
                </span>
              </button>

              <button
                onClick={() => handleOpenCreate('vendor')}
                className="flex flex-col items-center p-4 bg-amber-950/30 border border-amber-600/30 hover:border-amber-500/60 rounded-2xl transition group text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-amber-300">+ Register Vendor</span>
                <span className="text-[11px] text-stone-400 mt-0.5 text-center">
                  Add suppliers to raise purchase orders & bills
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Partners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPartners.map((partner) => {
          const isCustomer = partner.type === 'customer' || partner.type === 'both';
          const isVendor = partner.type === 'vendor' || partner.type === 'both';

          return (
            <div
              key={partner.id}
              className="p-4 bg-stone-900 border border-stone-800 rounded-3xl space-y-3 shadow-xs relative group hover:border-stone-700 transition"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-stone-100">{partner.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        partner.type === 'customer'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : partner.type === 'vendor'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {partner.type}
                    </span>
                    {partner.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-medium">
                        {partner.category}
                      </span>
                    )}
                  </div>

                  {partner.companyName && (
                    <p className="text-xs text-stone-400 font-medium">{partner.companyName}</p>
                  )}

                  {partner.contactPerson && (
                    <p className="text-xs text-stone-300 flex items-center gap-1">
                      <span className="text-stone-500">Contact:</span>
                      <strong className="font-medium">{partner.contactPerson}</strong>
                    </p>
                  )}
                </div>

                {/* Balance display */}
                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-bold text-sm block ${
                      partner.currentBalance > 0
                        ? 'text-emerald-400'
                        : partner.currentBalance < 0
                        ? 'text-amber-400'
                        : 'text-stone-400'
                    }`}
                  >
                    ${Math.abs(partner.currentBalance).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    {partner.currentBalance > 0
                      ? 'Receivable'
                      : partner.currentBalance < 0
                      ? 'Payable'
                      : 'Settled'}
                  </span>
                </div>
              </div>

              {/* Contact info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-stone-950/70 p-3 rounded-2xl text-stone-300 border border-stone-800/60">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="truncate">{partner.email || 'No email specified'}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="truncate">{partner.phone || 'No phone'}</span>
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-[11px] text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                  <span className="truncate">{partner.billingAddress || 'Address on file'}</span>
                </div>
                {partner.bankDetails && (
                  <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-[11px] text-stone-400 pt-1 border-t border-stone-800/60">
                    <Building className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">Bank: {partner.bankDetails}</span>
                  </div>
                )}
              </div>

              {/* Financial & Terms Bar */}
              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/60">
                <div className="flex items-center gap-3 font-mono">
                  <span>Tax: {partner.taxNumber}</span>
                  <span>•</span>
                  <span>Net {partner.paymentTermsDays}d</span>
                </div>
                {isCustomer && (
                  <span>
                    Credit: <strong className="text-stone-200">${partner.creditLimit.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {isCustomer && onNavigate && (
                    <button
                      onClick={() => onNavigate('sales')}
                      className="px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-sky-400 hover:text-sky-300 rounded-lg text-[11px] font-semibold transition"
                    >
                      + Sale Order
                    </button>
                  )}
                  {isVendor && onNavigate && (
                    <button
                      onClick={() => onNavigate('purchasing')}
                      className="px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-amber-400 hover:text-amber-300 rounded-lg text-[11px] font-semibold transition"
                    >
                      + PO
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(partner)}
                    className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
                    title="Edit Partner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPartnerToDelete(partner)}
                    className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-lg transition"
                    title="Delete Partner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Partner Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 my-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">
                  {editingPartner ? 'Edit Partner Details' : type === 'customer' ? 'Add New Customer' : type === 'vendor' ? 'Add New Vendor' : 'Add New Partner'}
                </h3>
                <p className="text-[11px] text-stone-400">
                  Profile, financial limits, and operational addresses
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Partner Type Selector */}
              <div>
                <label className="text-stone-400 block mb-1 font-semibold">
                  Partner Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('customer')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                      type === 'customer'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('vendor')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                      type === 'vendor'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    Vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('both')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                      type === 'both'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              {/* Name & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1 font-semibold">
                    Display / Trading Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Industrial Solutions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Legal Entity / Registered Company</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Global Tech LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Contact Person & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Key Contact Person & Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance (VP Procurement)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Classification Category</label>
                  <input
                    type="text"
                    placeholder={type === 'customer' ? 'e.g. Enterprise, SME, Wholesale' : 'e.g. Raw Material, Logistics, OEM'}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Billing / Commercial Email</label>
                  <input
                    type="email"
                    placeholder="accounts@apex-industrial.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Direct Phone / Hotline</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 430-9000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tax & Financial limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Tax Registration / VAT ID</label>
                  <input
                    type="text"
                    placeholder="US-TAX-8921"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Payment Terms</label>
                  <select
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value={0}>Immediate / COD</option>
                    <option value={15}>Net 15 Days</option>
                    <option value={30}>Net 30 Days</option>
                    <option value={45}>Net 45 Days</option>
                    <option value={60}>Net 60 Days</option>
                    <option value={90}>Net 90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Credit Limit ($)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    placeholder="Street, Suite, City, State, Postal Code"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-1">Shipping / Delivery Address</label>
                  <textarea
                    rows={2}
                    placeholder="Warehouse Dock / Receiving address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <label className="text-stone-400 block mb-1">Bank Settlement Details (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. JPMorgan Chase • Acct: ****8820 • Routing: 121000358"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-stone-400 block mb-1">Internal Notes & Commercial Terms</label>
                <textarea
                  rows={2}
                  placeholder="Special pricing agreements, SLA notes, or receiving constraints..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition ${
                  !name.trim()
                    ? 'bg-stone-700 opacity-50 cursor-not-allowed'
                    : type === 'customer'
                    ? 'bg-sky-600 hover:bg-sky-500'
                    : type === 'vendor'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {editingPartner ? 'Update Partner' : 'Save Partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {partnerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-sm">Delete Partner Record?</h3>
            </div>
            <p className="text-xs text-stone-300">
              Are you sure you want to remove <strong className="text-white">{partnerToDelete.name}</strong> ({partnerToDelete.type})? This will remove their profile from active directory.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPartnerToDelete(null)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
