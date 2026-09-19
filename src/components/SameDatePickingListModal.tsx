import React, { useState, useMemo } from 'react';
import {
  X,
  ClipboardList,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Printer,
  PackageCheck,
  Building,
  Truck,
  Layers,
  ArrowRight,
  Filter,
  Search,
  CheckSquare,
  Square,
  Box,
  MapPin,
  Barcode,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { SalesOrder, PickingListItem, SameDateBatchPickingList, DeliveryNote } from '../types';

interface SameDatePickingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintPickingList: (data: SameDateBatchPickingList) => void;
  onOpenDeliveryNoteModal?: (salesOrder: SalesOrder) => void;
}

export const SameDatePickingListModal: React.FC<SameDatePickingListModalProps> = ({
  isOpen,
  onClose,
  onPrintPickingList,
  onOpenDeliveryNoteModal,
}) => {
  const { salesOrders, products, stockLevels, warehouses, createDeliveryNote, deliveryNotes } = useErp();

  // Selected date defaults to today (or latest order date)
  const todayStr = '2026-09-19';
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateFieldType, setDateFieldType] = useState<'orderDate' | 'expectedDeliveryDate'>('orderDate');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'confirmed' | 'delivered'>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'consolidated' | 'by_order'>('consolidated');
  const [searchTerm, setSearchTerm] = useState('');

  // Local state for tracking picked items in the active batch
  // key: productId, value: boolean
  const [pickedItemsState, setPickedItemsState] = useState<Record<string, boolean>>({});

  // Unique available order dates for quick chips
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    salesOrders.forEach((so) => {
      const d = dateFieldType === 'orderDate' ? so.orderDate : so.expectedDeliveryDate;
      if (d) dates.add(d);
    });
    return Array.from(dates).sort().reverse();
  }, [salesOrders, dateFieldType]);

  // Orders matching the selected date and filters
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((so) => {
      const orderDateVal = dateFieldType === 'orderDate' ? so.orderDate : so.expectedDeliveryDate;
      if (orderDateVal !== selectedDate) return false;

      if (selectedStatusFilter === 'confirmed' && so.status !== 'Confirmed') return false;
      if (selectedStatusFilter === 'delivered' && so.status !== 'Delivered') return false;
      if (selectedBranchId !== 'all' && so.branchId !== selectedBranchId) return false;

      return true;
    });
  }, [salesOrders, selectedDate, dateFieldType, selectedStatusFilter, selectedBranchId]);

  // Build Consolidated Picking List items aggregated by product
  const pickingListItems: PickingListItem[] = useMemo(() => {
    const itemMap = new Map<string, PickingListItem>();

    filteredOrders.forEach((order) => {
      order.lines.forEach((line) => {
        const prod = products.find((p) => p.id === line.productId);
        const existing = itemMap.get(line.productId);

        // Sum available stock across all warehouses
        const totalStock = stockLevels
          .filter((sl) => sl.productId === line.productId)
          .reduce((sum, sl) => sum + sl.onHand, 0);

        const binLoc = prod?.category === 'Semiconductors & ICs' || prod?.category === 'Industrial Electronics'
          ? 'Aisle A-02 / Shelf 1'
          : prod?.category === 'Robotics & Actuators'
          ? 'Aisle B-04 / Shelf 3'
          : prod?.category === 'Power Storage'
          ? 'Aisle D-01 / Hazardous Bay'
          : 'Aisle C-03 / Bin 4';

        if (existing) {
          existing.totalRequiredQuantity += line.quantity;
          existing.associatedOrders.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.partnerName,
            quantity: line.quantity,
          });
        } else {
          itemMap.set(line.productId, {
            productId: line.productId,
            productName: line.productName || prod?.name || 'Item',
            productCode: line.productCode || prod?.code || '',
            category: prod?.category || 'General',
            barcode: prod?.barcode,
            binLocation: binLoc,
            totalRequiredQuantity: line.quantity,
            pickedQuantity: 0,
            isPicked: false,
            availableStock: totalStock,
            stockStatus:
              totalStock >= line.quantity
                ? 'In Stock'
                : totalStock > 0
                ? 'Low Stock'
                : 'Out of Stock',
            associatedOrders: [
              {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerName: order.partnerName,
                quantity: line.quantity,
              },
            ],
          });
        }
      });
    });

    const items = Array.from(itemMap.values()).map((item) => {
      const isPicked = !!pickedItemsState[item.productId];
      return {
        ...item,
        isPicked,
        pickedQuantity: isPicked ? item.totalRequiredQuantity : 0,
      };
    });

    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.productName.toLowerCase().includes(term) ||
        item.productCode.toLowerCase().includes(term) ||
        (item.binLocation && item.binLocation.toLowerCase().includes(term))
    );
  }, [filteredOrders, products, stockLevels, pickedItemsState, searchTerm]);

  // Aggregate metrics
  const totalUnits = useMemo(() => {
    return pickingListItems.reduce((sum, item) => sum + item.totalRequiredQuantity, 0);
  }, [pickingListItems]);

  const pickedUnits = useMemo(() => {
    return pickingListItems.reduce((sum, item) => sum + (item.isPicked ? item.totalRequiredQuantity : 0), 0);
  }, [pickingListItems]);

  const progressPercent = totalUnits > 0 ? Math.round((pickedUnits / totalUnits) * 100) : 0;

  // Toggle item picked
  const handleTogglePicked = (productId: string) => {
    setPickedItemsState((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Mark all items as picked
  const handleMarkAllPicked = () => {
    const next: Record<string, boolean> = {};
    pickingListItems.forEach((i) => {
      next[i.productId] = true;
    });
    setPickedItemsState(next);
  };

  // Reset picking state
  const handleResetPicking = () => {
    setPickedItemsState({});
  };

  // Prepare batch object for printing
  const batchData: SameDateBatchPickingList = useMemo(() => {
    return {
      date: selectedDate,
      dateType: dateFieldType,
      totalOrders: filteredOrders.length,
      orderIds: filteredOrders.map((o) => o.id),
      orderNumbers: filteredOrders.map((o) => o.orderNumber),
      items: pickingListItems,
      totalUnitsToPick: totalUnits,
      pickedUnits: pickedUnits,
      status: progressPercent === 100 ? 'Completed' : progressPercent > 0 ? 'In Progress' : 'Pending',
      generatedAt: new Date().toISOString(),
      pickerName: 'Warehouse Dispatch Team',
    };
  }, [selectedDate, dateFieldType, filteredOrders, pickingListItems, totalUnits, pickedUnits, progressPercent]);

  // Batch generate Delivery Notes for all confirmed orders of this date
  const [isBatchCreatingDn, setIsBatchCreatingDn] = useState(false);
  const [batchDnSuccessMessage, setBatchDnSuccessMessage] = useState<string | null>(null);

  const handleGenerateBatchDeliveryNotes = () => {
    setIsBatchCreatingDn(true);
    let createdCount = 0;

    filteredOrders.forEach((order) => {
      // Check if order already has delivery note
      const existingDn = deliveryNotes.find((dn) => dn.salesOrderId === order.id);
      if (!existingDn && (order.status === 'Confirmed' || order.status === 'Draft')) {
        const dnLines = order.lines.map((l, idx) => ({
          id: `dnl-${Date.now()}-${idx}`,
          productId: l.productId,
          productName: l.productName,
          productCode: l.productCode,
          orderedQuantity: l.quantity,
          dispatchedQuantity: l.quantity,
          backorderQuantity: 0,
          unitOfMeasure: 'pcs',
          serialOrLotNumber: `LOT-${order.orderNumber.replace('SO-', '')}`,
        }));

        createDeliveryNote({
          salesOrderId: order.id,
          salesOrderNumber: order.orderNumber,
          partnerId: order.partnerId,
          customerName: order.partnerName,
          customerAddress: 'Primary Shipping Dock',
          deliveryAddress: 'Customer Designated Receiving Dock',
          dispatchDate: selectedDate,
          expectedDeliveryDate: order.expectedDeliveryDate || selectedDate,
          carrierName: 'Internal Fleet Dedicated Dispatch',
          trackingNumber: `TRK-BATCH-${order.orderNumber.replace('SO-', '')}`,
          driverName: 'Dispatch Logistics Team',
          status: 'Ready for Dispatch',
          lines: dnLines,
          totalPackages: Math.max(1, Math.ceil(order.lines.length * 1.5)),
          totalWeightKg: Math.round(order.lines.reduce((s, l) => s + l.quantity * 1.2, 0) * 10) / 10,
          branchId: order.branchId || 'br-hq',
          warehouseId: warehouses[0]?.id || 'wh-main',
        } as any);

        createdCount++;
      }
    });

    setIsBatchCreatingDn(false);
    setBatchDnSuccessMessage(`Successfully generated ${createdCount} Delivery Notes for ${selectedDate} orders!`);
    setTimeout(() => setBatchDnSuccessMessage(null), 4500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 sm:p-6 space-y-5 my-6 max-h-[92vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-stone-100">
                  Batch Picking List — Same Date Orders
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Consolidated wave fulfillment & stock gathering for sales orders dispatched together
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => onPrintPickingList(batchData)}
              disabled={pickingListItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 disabled:opacity-50 text-stone-200 border border-stone-700/80 rounded-xl text-xs font-semibold shadow-xs transition"
              title="Print official consolidated picking list with letterhead"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Pick List</span>
            </button>

            <button
              onClick={handleGenerateBatchDeliveryNotes}
              disabled={filteredOrders.length === 0 || isBatchCreatingDn}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
              title="Create Delivery Notes for all confirmed orders of this date"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Generate Delivery Notes</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {batchDnSuccessMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{batchDnSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Date Selector & Filtering Toolbar */}
        <div className="bg-stone-950/70 border border-stone-800/80 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Date field selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Filter Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-stone-900 border border-stone-750 text-stone-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
              />

              <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDateFieldType('orderDate')}
                  className={`px-2 py-1 rounded-lg transition ${
                    dateFieldType === 'orderDate' ? 'bg-emerald-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Order Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateFieldType('expectedDeliveryDate')}
                  className={`px-2 py-1 rounded-lg transition ${
                    dateFieldType === 'expectedDeliveryDate' ? 'bg-emerald-600 text-white font-medium' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Delivery Date
                </button>
              </div>
            </div>

            {/* Quick Date Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-400">Quick dates:</span>
              {availableDates.slice(0, 4).map((d) => {
                const count = salesOrders.filter((so) =>
                  (dateFieldType === 'orderDate' ? so.orderDate : so.expectedDeliveryDate) === d
                ).length;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 ${
                      selectedDate === d
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    <span>{d === todayStr ? 'Today' : d}</span>
                    <span className="text-[10px] px-1 rounded-full bg-stone-800 text-stone-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Controls: Search, View Mode, Status Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-850">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search items, SKU, or aisle location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('consolidated')}
                  className={`px-3 py-1 rounded-lg transition ${
                    viewMode === 'consolidated'
                      ? 'bg-stone-800 text-emerald-400 font-semibold shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Consolidated by Item ({pickingListItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('by_order')}
                  className={`px-3 py-1 rounded-lg transition ${
                    viewMode === 'by_order'
                      ? 'bg-stone-800 text-emerald-400 font-semibold shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  By Sales Order ({filteredOrders.length})
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={handleMarkAllPicked}
                  className="px-2.5 py-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 rounded-lg transition flex items-center gap-1 font-medium"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Mark All
                </button>
                <button
                  type="button"
                  onClick={handleResetPicking}
                  className="px-2.5 py-1 text-stone-400 hover:text-stone-300 bg-stone-900 border border-stone-800 rounded-lg transition flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-950/50 border border-stone-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Orders on Date</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-stone-100">{filteredOrders.length}</span>
              <span className="text-xs text-stone-400">Sales Orders</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-1 truncate">
              {filteredOrders.map((o) => o.orderNumber).join(', ') || 'None found'}
            </div>
          </div>

          <div className="bg-stone-950/50 border border-stone-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Distinct SKUs</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-teal-400">{pickingListItems.length}</span>
              <span className="text-xs text-stone-400">Products</span>
            </div>
            <div className="text-[10px] text-teal-400/80 mt-1">Sorted by warehouse aisle</div>
          </div>

          <div className="bg-stone-950/50 border border-stone-800 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Units to Pick</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-extrabold text-emerald-400">{totalUnits}</span>
              <span className="text-xs text-stone-400">pieces</span>
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1">Across all {filteredOrders.length} orders</div>
          </div>

          <div className="bg-stone-950/50 border border-stone-800 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Picking Progress</span>
              <span className="text-xs font-bold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-stone-400 mt-1.5">
              {pickedUnits} of {totalUnits} units gathered
            </div>
          </div>
        </div>

        {/* Content Body: Consolidated vs By Order */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-stone-950/40 rounded-2xl border border-stone-800/80 space-y-2">
              <Box className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-sm font-semibold text-stone-300">No Sales Orders for {selectedDate}</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Select another date using the date picker or quick date chips above to view scheduled batch picking.
              </p>
            </div>
          ) : viewMode === 'consolidated' ? (
            /* Consolidated Wave Picking Table */
            <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-950/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-900/90 border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 w-10">Pick</th>
                    <th className="py-2.5 px-3">Location & SKU</th>
                    <th className="py-2.5 px-3">Product Name & Category</th>
                    <th className="py-2.5 px-3 text-right">Required Qty</th>
                    <th className="py-2.5 px-3">Warehouse Stock</th>
                    <th className="py-2.5 px-3">Orders Contributing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {pickingListItems.map((item) => {
                    const isFullyPicked = item.isPicked;
                    return (
                      <tr
                        key={item.productId}
                        className={`transition hover:bg-stone-900/50 ${
                          isFullyPicked ? 'bg-emerald-950/20 text-stone-300' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleTogglePicked(item.productId)}
                            className="text-stone-400 hover:text-emerald-400 transition"
                          >
                            {isFullyPicked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Square className="w-5 h-5 text-stone-600 hover:text-stone-400" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 text-teal-400 font-mono text-[11px]">
                            <MapPin className="w-3 h-3 text-teal-500 shrink-0" />
                            <span className="font-semibold">{item.binLocation}</span>
                          </div>
                          <div className="font-mono text-stone-300 text-xs mt-0.5">{item.productCode}</div>
                          {item.barcode && (
                            <div className="text-[10px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                              <Barcode className="w-3 h-3" />
                              <span>{item.barcode}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className={`font-semibold ${isFullyPicked ? 'line-through text-stone-400' : 'text-stone-100'}`}>
                            {item.productName}
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md bg-stone-850 text-stone-400 text-[10px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="text-base font-extrabold text-emerald-400 font-mono">
                            {item.totalRequiredQuantity}
                          </span>
                          <span className="text-[10px] text-stone-400 ml-1">units</span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                item.stockStatus === 'In Stock'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : item.stockStatus === 'Low Stock'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {item.availableStock} in stock
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {item.associatedOrders.map((ao) => (
                              <span
                                key={ao.orderId}
                                className="text-[10px] px-2 py-0.5 bg-stone-900 border border-stone-800 rounded-md font-mono text-stone-300"
                                title={`Customer: ${ao.customerName}`}
                              >
                                {ao.orderNumber} ({ao.quantity}x)
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grouped by Order View */
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const linkedDn = deliveryNotes.find((dn) => dn.salesOrderId === order.id);
                return (
                  <div
                    key={order.id}
                    className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4 space-y-3 hover:border-stone-750 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-850 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-sm">{order.orderNumber}</span>
                          <span className="text-xs text-stone-200 font-semibold">• {order.partnerName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              order.status === 'Delivered'
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Order Date: {order.orderDate} | Expected Delivery: {order.expectedDeliveryDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {linkedDn ? (
                          <span className="text-xs text-teal-300 flex items-center gap-1 font-mono bg-teal-950/40 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                            <Truck className="w-3.5 h-3.5 text-teal-400" />
                            {linkedDn.deliveryNoteNumber} ({linkedDn.status})
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenDeliveryNoteModal && onOpenDeliveryNoteModal(order)}
                            className="text-xs px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg font-medium flex items-center gap-1 transition"
                          >
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Create Delivery Note</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Line Items */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-stone-400 border-b border-stone-850 text-[10px] uppercase font-bold">
                            <th className="py-1.5 px-2">SKU & Product</th>
                            <th className="py-1.5 px-2 text-right">Quantity</th>
                            <th className="py-1.5 px-2 text-right">Unit Price</th>
                            <th className="py-1.5 px-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-850/50 text-stone-300">
                          {order.lines.map((l) => (
                            <tr key={l.id}>
                              <td className="py-2 px-2">
                                <span className="font-mono text-stone-400 text-[11px] block">{l.productCode}</span>
                                <span className="font-medium text-stone-200">{l.productName}</span>
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-emerald-400">
                                {l.quantity} pcs
                              </td>
                              <td className="py-2 px-2 text-right font-mono">${l.unitPrice.toFixed(2)}</td>
                              <td className="py-2 px-2 text-right font-mono text-stone-200">
                                ${l.lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer / Dispatch Actions */}
        <div className="border-t border-stone-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-stone-400">
            Batch picking groups items across orders so warehouse runners visit each aisle once.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={() => onPrintPickingList(batchData)}
              disabled={pickingListItems.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-1.5 transition shadow-md shadow-emerald-950"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Picking Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
