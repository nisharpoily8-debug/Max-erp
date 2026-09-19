import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Package,
  Calendar,
  User,
  MapPin,
  FileText,
  Printer,
  CheckCircle2,
  AlertCircle,
  Hash,
  Clock,
  ShieldCheck,
  Building,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { SalesOrder, DeliveryNote, DeliveryNoteStatus, DeliveryNoteLine } from '../types';

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder?: SalesOrder | null;
  existingDeliveryNote?: DeliveryNote | null;
  onPrintDeliveryNote?: (note: DeliveryNote) => void;
  onViewAuditTrail?: (note: DeliveryNote) => void;
}

export const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  existingDeliveryNote,
  onPrintDeliveryNote,
  onViewAuditTrail,
}) => {
  const { partners, createDeliveryNote, updateDeliveryNoteStatus, deliveryNotes } = useErp();

  // Find linked delivery note if not explicitly provided
  const activeNote = existingDeliveryNote || (salesOrder ? deliveryNotes.find((dn) => dn.salesOrderId === salesOrder.id) : null);

  // Form states
  const [carrierName, setCarrierName] = useState<string>(activeNote?.carrierName || 'FedEx Express Freight');
  const [trackingNumber, setTrackingNumber] = useState<string>(activeNote?.trackingNumber || '');
  const [driverName, setDriverName] = useState<string>(activeNote?.driverName || 'Carlos Ramirez');
  const [vehicleNumber, setVehicleNumber] = useState<string>(activeNote?.vehicleNumber || 'VAN-204');
  const [dispatchDate, setDispatchDate] = useState<string>(activeNote?.dispatchDate || '2026-09-19');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    activeNote?.expectedDeliveryDate || salesOrder?.expectedDeliveryDate || '2026-09-22'
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    activeNote?.deliveryAddress || ''
  );
  const [totalPackages, setTotalPackages] = useState<number>(activeNote?.totalPackages || 2);
  const [totalWeightKg, setTotalWeightKg] = useState<number>(activeNote?.totalWeightKg || 15.0);
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    activeNote?.specialInstructions || 'Handle with care. Offload at dock 2 with forklift.'
  );

  // Recipient signature state
  const [recipientName, setRecipientName] = useState<string>(activeNote?.receivedBy || '');
  const [isDelivering, setIsDelivering] = useState(false);

  // Sync address from partner
  useEffect(() => {
    if (!activeNote && salesOrder) {
      const partner = partners.find((p) => p.id === salesOrder.partnerId);
      if (partner?.shippingAddress) {
        setDeliveryAddress(partner.shippingAddress);
      } else if (partner?.billingAddress) {
        setDeliveryAddress(partner.billingAddress);
      }
    }
  }, [activeNote, salesOrder, partners]);

  // Sync state when activeNote changes
  useEffect(() => {
    if (activeNote) {
      setCarrierName(activeNote.carrierName);
      setTrackingNumber(activeNote.trackingNumber || '');
      setDriverName(activeNote.driverName || '');
      setVehicleNumber(activeNote.vehicleNumber || '');
      setDispatchDate(activeNote.dispatchDate);
      setExpectedDeliveryDate(activeNote.expectedDeliveryDate);
      setDeliveryAddress(activeNote.deliveryAddress);
      setTotalPackages(activeNote.totalPackages || 1);
      setTotalWeightKg(activeNote.totalWeightKg || 10);
      setSpecialInstructions(activeNote.specialInstructions || '');
      setRecipientName(activeNote.receivedBy || '');
    }
  }, [activeNote]);

  if (!isOpen) return null;

  const targetPartner = salesOrder
    ? partners.find((p) => p.id === salesOrder.partnerId)
    : partners.find((p) => p.id === activeNote?.partnerId);

  // Handle Save / Create
  const handleSaveDeliveryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesOrder && !activeNote) return;

    if (!activeNote && salesOrder) {
      const lines: DeliveryNoteLine[] = salesOrder.lines.map((line, idx) => ({
        id: `dnl-${Date.now()}-${idx}`,
        productId: line.productId,
        productName: line.productName,
        productCode: line.productCode,
        orderedQuantity: line.quantity,
        dispatchedQuantity: line.quantity,
        backorderQuantity: 0,
        unitOfMeasure: 'pcs',
        serialOrLotNumber: `LOT-${salesOrder.orderNumber.replace('SO-', '')}`,
      }));

      const created = createDeliveryNote({
        salesOrderId: salesOrder.id,
        salesOrderNumber: salesOrder.orderNumber,
        partnerId: salesOrder.partnerId,
        customerName: salesOrder.partnerName,
        customerContact: targetPartner?.contactPerson || 'Purchasing Department',
        customerPhone: targetPartner?.phone,
        deliveryAddress: deliveryAddress || targetPartner?.shippingAddress || 'Customer Site',
        dispatchDate,
        expectedDeliveryDate,
        carrierName,
        trackingNumber,
        driverName,
        vehicleNumber,
        status: 'Ready for Dispatch',
        lines,
        totalPackages,
        totalWeightKg,
        specialInstructions,
        branchId: salesOrder.branchId || 'br-hq',
      });

      if (onPrintDeliveryNote) {
        onPrintDeliveryNote(created);
      }
      onClose();
    }
  };

  // Handle Status Transitions
  const handleSetStatus = (newStatus: DeliveryNoteStatus) => {
    if (!activeNote) return;
    if (newStatus === 'Delivered') {
      setIsDelivering(true);
    } else {
      updateDeliveryNoteStatus(activeNote.id, newStatus);
    }
  };

  const handleConfirmDelivery = () => {
    if (!activeNote) return;
    updateDeliveryNoteStatus(activeNote.id, 'Delivered', recipientName || 'Authorized Receiving Staff');
    setIsDelivering(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 sm:p-6 space-y-5 my-6 max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-stone-100">
                  {activeNote ? `Delivery Note ${activeNote.deliveryNoteNumber}` : 'Create Delivery Note (Packing Slip)'}
                </h3>
                {activeNote && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      activeNote.status === 'Delivered'
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        : activeNote.status === 'Dispatched'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {activeNote.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Official dispatch waybill, carrier details & recipient proof of delivery (POD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeNote && onPrintDeliveryNote && (
              <button
                type="button"
                onClick={() => onPrintDeliveryNote(activeNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>Print / PDF</span>
              </button>
            )}

            {activeNote && onViewAuditTrail && (
              <button
                type="button"
                onClick={() => onViewAuditTrail(activeNote)}
                className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition"
                title="View audit trail"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Lifecycle Banner if existing note */}
        {activeNote && (
          <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Current Status:</span>
              <span className="font-bold text-stone-200">{activeNote.status}</span>
              {activeNote.receivedBy && (
                <span className="text-teal-400 text-[11px]">
                  (Signed by: {activeNote.receivedBy})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeNote.status === 'Ready for Dispatch' && (
                <button
                  type="button"
                  onClick={() => handleSetStatus('Dispatched')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 transition text-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Mark as Dispatched</span>
                </button>
              )}

              {activeNote.status === 'Dispatched' && (
                <button
                  type="button"
                  onClick={() => setIsDelivering(true)}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold flex items-center gap-1 transition text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Record Proof of Delivery</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSaveDeliveryNote} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Order & Customer Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-950/50 p-3.5 rounded-2xl border border-stone-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Sales Order Reference
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {activeNote ? activeNote.salesOrderNumber : salesOrder?.orderNumber}
                </span>
                <span className="text-xs text-stone-400">
                  (Order Date: {activeNote?.dispatchDate || salesOrder?.orderDate})
                </span>
              </div>
              <div className="text-xs text-stone-300 font-semibold mt-1">
                {activeNote ? activeNote.customerName : salesOrder?.partnerName}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Delivery Destination
              </span>
              <div className="text-xs text-stone-300 mt-1 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                <textarea
                  rows={2}
                  disabled={!!activeNote}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street address, Dock/Bay, City, State, ZIP..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1 text-xs text-stone-200 disabled:opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Logistics & Carrier Configuration */}
          <div className="bg-stone-950/40 p-4 rounded-2xl border border-stone-800 space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-teal-400" /> Carrier & Waybill Logistics
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Carrier / Logistics Provider</label>
                <select
                  disabled={!!activeNote}
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 disabled:opacity-80"
                >
                  <option value="FedEx Express Freight">FedEx Express Freight</option>
                  <option value="DHL Supply Chain">DHL Supply Chain</option>
                  <option value="UPS Freight Priority">UPS Freight Priority</option>
                  <option value="Internal Fleet Dedicated Courier">Internal Fleet Dedicated Courier</option>
                  <option value="Direct Courier Dispatch">Direct Courier Dispatch</option>
                  <option value="Customer Dock Pickup">Customer Dock Pickup</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Tracking Number / Waybill #</label>
                <input
                  type="text"
                  disabled={!!activeNote}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. FX-99201948"
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-mono disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Driver & Vehicle No.</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    disabled={!!activeNote}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver Name"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 disabled:opacity-80"
                  />
                  <input
                    type="text"
                    disabled={!!activeNote}
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Vehicle / Van #"
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 font-mono disabled:opacity-80"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Dispatch Date</label>
                <input
                  type="date"
                  disabled={!!activeNote}
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-mono disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Expected Delivery</label>
                <input
                  type="date"
                  disabled={!!activeNote}
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-mono disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Total Packages (Boxes/Pallets)</label>
                <input
                  type="number"
                  min="1"
                  disabled={!!activeNote}
                  value={totalPackages}
                  onChange={(e) => setTotalPackages(Number(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-mono disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-[11px] text-stone-400 mb-1">Total Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  disabled={!!activeNote}
                  value={totalWeightKg}
                  onChange={(e) => setTotalWeightKg(Number(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-mono disabled:opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Line Items Dispatched Table */}
          <div className="bg-stone-950/40 p-4 rounded-2xl border border-stone-800 space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" /> Dispatched Items & Serial / Lot Numbers
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px] font-bold">
                    <th className="py-2 px-2">SKU & Item Name</th>
                    <th className="py-2 px-2 text-right">Ordered</th>
                    <th className="py-2 px-2 text-right">Dispatched</th>
                    <th className="py-2 px-2 text-right">Backorder</th>
                    <th className="py-2 px-2">Lot / Serial #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 text-stone-300">
                  {activeNote ? (
                    activeNote.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-2">
                          <span className="font-mono text-stone-400 text-[11px] block">{l.productCode}</span>
                          <span className="font-semibold text-stone-200">{l.productName}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-stone-400">{l.orderedQuantity}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-emerald-400">
                          {l.dispatchedQuantity}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-stone-500">{l.backorderQuantity}</td>
                        <td className="py-2 px-2 font-mono text-stone-300 text-[11px]">
                          {l.serialOrLotNumber || '—'}
                        </td>
                      </tr>
                    ))
                  ) : salesOrder ? (
                    salesOrder.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 px-2">
                          <span className="font-mono text-stone-400 text-[11px] block">{l.productCode}</span>
                          <span className="font-semibold text-stone-200">{l.productName}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-stone-400">{l.quantity}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-emerald-400">{l.quantity}</td>
                        <td className="py-2 px-2 text-right font-mono text-stone-500">0</td>
                        <td className="py-2 px-2 font-mono text-stone-300 text-[11px]">
                          LOT-{salesOrder.orderNumber.replace('SO-', '')}
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="block text-[11px] text-stone-400 mb-1">
              Handling & Delivery Instructions
            </label>
            <textarea
              rows={2}
              disabled={!!activeNote}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 disabled:opacity-80"
            />
          </div>

          {/* Record Proof of Delivery Modal Dialog / Inline Form */}
          {isDelivering && (
            <div className="p-4 bg-teal-950/40 border border-teal-500/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Confirm Recipient Proof of Delivery (POD)</span>
              </div>
              <p className="text-xs text-stone-400">
                Enter the name of the authorized customer staff member who accepted the goods.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins (Warehouse Manager)"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="flex-1 bg-stone-900 border border-teal-500/40 rounded-xl px-3 py-1.5 text-xs text-stone-100"
                />
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save POD & Close
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
            {!activeNote && salesOrder && (
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-emerald-950"
              >
                <Truck className="w-4 h-4" />
                <span>Generate Delivery Note</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
