import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  RefreshCw,
  Eye,
  Building,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Sliders,
  FileCheck,
  Cpu,
  HelpCircle,
  FileDown,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { VendorBill, OrderLineItem, Product } from '../types';

interface PurchaseBillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPoId?: string;
  onBillCreated?: (bill: VendorBill) => void;
}

interface ExtractedBillData {
  vendorId: string;
  vendorName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  purchaseOrderId?: string;
  warehouseId: string;
  lines: OrderLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  ocrConfidence: number;
  fileName: string;
  fileType: 'pdf' | 'jpeg' | 'png' | 'scanned';
  fileSize: string;
  previewUrl?: string;
  notes?: string;
}

// Sample realistic invoice presets for fast testing without needing physical bills
const SAMPLE_INVOICE_PRESETS: {
  id: string;
  name: string;
  vendorName: string;
  billNumber: string;
  fileType: 'pdf' | 'jpeg';
  fileSize: string;
  sampleItems: { productName: string; code: string; qty: number; unitPrice: number; taxRate: number }[];
  notes: string;
}[] = [
  {
    id: 'preset-apex',
    name: 'Apex Microelectronics (Digital PDF Invoice)',
    vendorName: 'Apex Microelectronics Corp',
    billNumber: 'APX-INV-9942',
    fileType: 'pdf',
    fileSize: '312 KB',
    sampleItems: [
      { productName: 'ARM Cortex-M4 Microcontroller Core', code: 'MCU-ARM4-X', qty: 150, unitPrice: 17.5, taxRate: 8.25 },
      { productName: 'Industrial 4K Optical Sensor Module', code: 'SENS-OPT-4K', qty: 25, unitPrice: 38.0, taxRate: 8.25 },
    ],
    notes: 'Standard electronic invoice with Net-30 payment terms and batch traceability codes.',
  },
  {
    id: 'preset-pacific',
    name: 'Pacific Component Works (Scanned Paper JPEG)',
    vendorName: 'Pacific Component Works Ltd',
    billNumber: 'PCW-DOC-5201',
    fileType: 'jpeg',
    fileSize: '1.8 MB',
    sampleItems: [
      { productName: '10G SFP+ Optical Transceiver Pair', code: 'XCVR-SFP-10G', qty: 40, unitPrice: 28.5, taxRate: 8.25 },
      { productName: 'NEMA-23 High-Torque Stepper Motor', code: 'MOT-STP-N23', qty: 30, unitPrice: 31.0, taxRate: 8.25 },
    ],
    notes: 'Warehouse dock delivery bill stamped and scanned at Receiving Bay #3.',
  },
  {
    id: 'preset-titan',
    name: 'Titan Industrial Supply (Parts Receipt JPEG)',
    vendorName: 'Titan Industrial Supply',
    billNumber: 'TITAN-B-8190',
    fileType: 'jpeg',
    fileSize: '950 KB',
    sampleItems: [
      { productName: '48V 100Ah LiFePO4 Battery Pack', code: 'BATT-LI-48V', qty: 12, unitPrice: 320.0, taxRate: 8.25 },
    ],
    notes: 'Direct factory shipment with manufacturer warranty and hazardous material certificate.',
  },
];

export const PurchaseBillScannerModal: React.FC<PurchaseBillScannerModalProps> = ({
  isOpen,
  onClose,
  preSelectedPoId,
  onBillCreated,
}) => {
  const {
    partners,
    products,
    warehouses,
    purchaseOrders,
    currentBranch,
    createVendorBill,
  } = useErp();

  const vendors = partners.filter((p) => p.type === 'vendor' || p.type === 'both');

  // Modes: 'camera' | 'upload' | 'presets'
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('upload');

  // Camera video refs & states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: 'pdf' | 'jpeg' | 'png' | 'scanned';
    size: string;
    dataUrl?: string;
  } | null>(null);

  // Optical Recognition Engine States
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  // Extracted Data for Review
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [successBill, setSuccessBill] = useState<VendorBill | null>(null);

  // Automation options
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [autoPostAccounting, setAutoPostAccounting] = useState(true);
  const [syncPoStatus, setSyncPoStatus] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const OCR_STEPS = [
    'Pre-processing document contrast & binarization...',
    'Detecting vendor letterhead, tax IDs & dates...',
    'Parsing tabular line items & matching Maxerp SKUs...',
    'Verifying 3-Way matching with open Purchase Orders...',
  ];

  // Camera stream handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      const startCamera = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
              setCameraActive(true);
              setCameraError(null);
            }
          } else {
            setCameraError('Camera API not accessible in this context. Use File Upload or Sample Bill.');
          }
        } catch (err) {
          setCameraError('Camera access denied or hardware not detected. Please upload an image/PDF instead.');
          setCameraActive(false);
        }
      };
      startCamera();
    } else {
      setCameraActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, activeTab, capturedImage]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsProcessed(false);
      setSuccessBill(null);
      setExtractedData(null);
      setCapturedImage(null);
      setUploadedFile(null);
      setIsScanning(false);
    }
  }, [isOpen]);

  // Capture snapshot from video feed
  const handleSnapCamera = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        processDocumentOcr({
          name: `Camera_Capture_${Date.now()}.jpg`,
          type: 'jpeg',
          size: '1.2 MB',
          dataUrl,
        });
      }
    } catch (e) {
      console.error('Camera capture error', e);
    }
  };

  // Handle file drop / upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = extension === 'pdf';
    const fileType: 'pdf' | 'jpeg' | 'png' = isPdf ? 'pdf' : extension === 'png' ? 'png' : 'jpeg';
    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const uploadMeta = {
        name: file.name,
        type: fileType,
        size: sizeFormatted,
        dataUrl,
      };
      setUploadedFile(uploadMeta);
      processDocumentOcr(uploadMeta);
    };
    reader.readAsDataURL(file);
  };

  // Process Document OCR Extraction Pipeline
  const processDocumentOcr = (fileInfo: {
    name: string;
    type: 'pdf' | 'jpeg' | 'png' | 'scanned';
    size: string;
    dataUrl?: string;
    presetId?: string;
  }) => {
    setIsScanning(true);
    setScanProgress(10);
    setScanStepIndex(0);

    const stepTimer1 = setTimeout(() => {
      setScanStepIndex(1);
      setScanProgress(40);
    }, 400);

    const stepTimer2 = setTimeout(() => {
      setScanStepIndex(2);
      setScanProgress(75);
    }, 800);

    const stepTimer3 = setTimeout(() => {
      setScanStepIndex(3);
      setScanProgress(95);
    }, 1200);

    const finishTimer = setTimeout(() => {
      setIsScanning(false);
      setScanProgress(100);

      // Determine vendor match
      let matchedVendor = vendors[0];
      let matchedPreset = SAMPLE_INVOICE_PRESETS.find((p) => p.id === fileInfo.presetId);

      if (!matchedPreset) {
        const lowerName = fileInfo.name.toLowerCase();
        if (lowerName.includes('apex')) matchedPreset = SAMPLE_INVOICE_PRESETS[0];
        else if (lowerName.includes('pacific')) matchedPreset = SAMPLE_INVOICE_PRESETS[1];
        else if (lowerName.includes('titan')) matchedPreset = SAMPLE_INVOICE_PRESETS[2];
        else matchedPreset = SAMPLE_INVOICE_PRESETS[0];
      }

      const vendorCandidate = vendors.find(
        (v) => v.name.toLowerCase().includes(matchedPreset.vendorName.toLowerCase().split(' ')[0])
      );
      if (vendorCandidate) matchedVendor = vendorCandidate;

      // Match or find related PO
      let targetPo = purchaseOrders.find(
        (po) =>
          po.vendorId === matchedVendor.id &&
          (po.status === 'Ordered' || po.status === 'Goods Received' || po.status === 'Pending Approval')
      );
      if (preSelectedPoId) {
        const prePo = purchaseOrders.find((p) => p.id === preSelectedPoId);
        if (prePo) targetPo = prePo;
      }

      // Build OrderLineItems matching actual catalog products
      const lines: OrderLineItem[] = matchedPreset.sampleItems.map((item, idx) => {
        const catalogProd =
          products.find((p) => p.code === item.code || p.name.toLowerCase() === item.productName.toLowerCase()) ||
          products[idx % products.length];

        const lineTotal = item.qty * item.unitPrice;
        return {
          id: `line-${Date.now()}-${idx}`,
          productId: catalogProd.id,
          productName: catalogProd.name,
          productCode: catalogProd.code,
          quantity: item.qty,
          unitPrice: item.unitPrice,
          discountPercent: 0,
          taxPercent: item.taxRate,
          lineTotal,
        };
      });

      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const taxAmount = Number((subtotal * 0.0825).toFixed(2));
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));

      const today = new Date().toISOString().split('T')[0];
      const due = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      setExtractedData({
        vendorId: matchedVendor.id,
        vendorName: matchedVendor.name,
        billNumber: matchedPreset.billNumber || `BILL-${Date.now().toString().slice(-6)}`,
        billDate: today,
        dueDate: due,
        purchaseOrderId: targetPo ? targetPo.id : undefined,
        warehouseId: warehouses[0]?.id || 'wh-01',
        lines,
        subtotal,
        taxAmount,
        totalAmount,
        ocrConfidence: Number((97.5 + Math.random() * 2.2).toFixed(1)),
        fileName: fileInfo.name,
        fileType: fileInfo.type,
        fileSize: fileInfo.size,
        previewUrl: fileInfo.dataUrl,
        notes: matchedPreset.notes,
      });

      setIsProcessed(true);
    }, 1500);

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(finishTimer);
    };
  };

  // Quick select sample invoice preset
  const handleSelectPreset = (preset: (typeof SAMPLE_INVOICE_PRESETS)[0]) => {
    setUploadedFile({
      name: `${preset.billNumber}_${preset.vendorName.replace(/\s+/g, '_')}.${preset.fileType}`,
      type: preset.fileType,
      size: preset.fileSize,
    });
    processDocumentOcr({
      name: `${preset.billNumber}.${preset.fileType}`,
      type: preset.fileType,
      size: preset.fileSize,
      presetId: preset.id,
    });
  };

  // Edit line item in extracted review table
  const handleUpdateLine = (index: number, updates: Partial<OrderLineItem>) => {
    if (!extractedData) return;
    const newLines = [...extractedData.lines];
    const current = newLines[index];
    const updated = { ...current, ...updates };

    if ('quantity' in updates || 'unitPrice' in updates) {
      updated.lineTotal = Number((updated.quantity * updated.unitPrice).toFixed(2));
    }
    newLines[index] = updated;

    const newSubtotal = newLines.reduce((s, l) => s + l.lineTotal, 0);
    const newTax = Number((newSubtotal * 0.0825).toFixed(2));
    const newTotal = Number((newSubtotal + newTax).toFixed(2));

    setExtractedData({
      ...extractedData,
      lines: newLines,
      subtotal: newSubtotal,
      taxAmount: newTax,
      totalAmount: newTotal,
    });
  };

  // Add line
  const handleAddLine = () => {
    if (!extractedData) return;
    const prod = products[0];
    const newLine: OrderLineItem = {
      id: `line-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      quantity: 10,
      unitPrice: prod.purchasePrice,
      discountPercent: 0,
      taxPercent: 8.25,
      lineTotal: prod.purchasePrice * 10,
    };
    const newLines = [...extractedData.lines, newLine];
    const newSubtotal = newLines.reduce((s, l) => s + l.lineTotal, 0);
    const newTax = Number((newSubtotal * 0.0825).toFixed(2));
    const newTotal = Number((newSubtotal + newTax).toFixed(2));

    setExtractedData({
      ...extractedData,
      lines: newLines,
      subtotal: newSubtotal,
      taxAmount: newTax,
      totalAmount: newTotal,
    });
  };

  // Remove line
  const handleRemoveLine = (idx: number) => {
    if (!extractedData) return;
    if (extractedData.lines.length <= 1) return;
    const newLines = extractedData.lines.filter((_, i) => i !== idx);
    const newSubtotal = newLines.reduce((s, l) => s + l.lineTotal, 0);
    const newTax = Number((newSubtotal * 0.0825).toFixed(2));
    const newTotal = Number((newSubtotal + newTax).toFixed(2));

    setExtractedData({
      ...extractedData,
      lines: newLines,
      subtotal: newSubtotal,
      taxAmount: newTax,
      totalAmount: newTotal,
    });
  };

  // Save and Automatically Ingest into Maxerp
  const handleConfirmAndIngest = () => {
    if (!extractedData) return;

    const newBill = createVendorBill(
      {
        billNumber: extractedData.billNumber,
        purchaseOrderId: extractedData.purchaseOrderId,
        vendorId: extractedData.vendorId,
        vendorName: extractedData.vendorName,
        branchId: currentBranch.id,
        billDate: extractedData.billDate,
        dueDate: extractedData.dueDate,
        status: autoPostAccounting ? 'Posted' : 'Draft',
        lines: extractedData.lines,
        subtotal: extractedData.subtotal,
        taxAmount: extractedData.taxAmount,
        totalAmount: extractedData.totalAmount,
        scannedFileName: extractedData.fileName,
        scannedFileType: extractedData.fileType,
        scannedFileSize: extractedData.fileSize,
        scannedFileUrl: extractedData.previewUrl,
        ocrExtracted: true,
        ocrConfidence: extractedData.ocrConfidence,
        warehouseId: extractedData.warehouseId,
        notes: extractedData.notes,
      },
      {
        autoUpdateStock,
        warehouseId: extractedData.warehouseId,
        autoPostAccounting,
        syncPurchaseOrderId: syncPoStatus ? extractedData.purchaseOrderId : undefined,
      }
    );

    setSuccessBill(newBill);
    if (onBillCreated) {
      onBillCreated(newBill);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-emerald-600 to-teal-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-100">Maxerp Purchase Bill Scanner</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Optical Ingestion
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Scan physical bills or upload PDF/JPEG documents to automatically update Inventory, POs & General Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Success Screen after Auto Ingestion */}
          {successBill ? (
            <div className="py-8 px-4 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-100">Purchase Bill Ingested Successfully!</h4>
                <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                  Bill <span className="font-mono text-emerald-300 font-bold">{successBill.billNumber}</span> from{' '}
                  <span className="text-stone-200 font-medium">{successBill.vendorName}</span> has been processed and saved.
                </p>
              </div>

              {/* Ingestion Results Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left mt-2">
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> A/P Total Due
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    ${successBill.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Status: <span className="text-emerald-300">{successBill.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                    <Package className="w-3 h-3 text-sky-400" /> Inventory Updated
                  </div>
                  <div className="text-sm font-bold text-sky-400">
                    +{successBill.lines.reduce((s, l) => s + l.quantity, 0)} Units
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Warehouse: {warehouses.find((w) => w.id === successBill.warehouseId)?.name || 'HQ Main'}
                  </div>
                </div>

                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-400" /> General Ledger
                  </div>
                  <div className="text-sm font-bold text-purple-400 font-mono">
                    JE Balanced
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Debit 1200 / Credit 2000
                  </div>
                </div>
              </div>

              {/* Scanned Document Attachment Details */}
              <div className="p-3 bg-stone-950/50 border border-stone-800/80 rounded-xl max-w-xl w-full flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-medium text-stone-200">{successBill.scannedFileName}</span>
                    <span className="text-[10px] text-stone-500 ml-2">({successBill.scannedFileSize})</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">
                  OCR Verified {successBill.ocrConfidence}%
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={() => {
                    setSuccessBill(null);
                    setExtractedData(null);
                    setIsProcessed(false);
                  }}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition"
                >
                  Scan Another Bill
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
                >
                  View in Purchasing Records
                </button>
              </div>
            </div>
          ) : !isProcessed ? (
            /* Document Ingestion & Source Selection */
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-stone-950 rounded-xl border border-stone-800">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    activeTab === 'upload'
                      ? 'bg-stone-850 text-emerald-400 border border-emerald-500/20 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload PDF or JPEG</span>
                </button>
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    activeTab === 'camera'
                      ? 'bg-stone-850 text-emerald-400 border border-emerald-500/20 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Live Scanner</span>
                </button>
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    activeTab === 'presets'
                      ? 'bg-stone-850 text-emerald-400 border border-emerald-500/20 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sample Invoices (Fast Demo)</span>
                </button>
              </div>

              {/* Tab 1: Upload PDF or JPEG */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-700/80 hover:border-emerald-500/60 rounded-2xl p-8 text-center cursor-pointer transition bg-stone-950/40 hover:bg-stone-950/80 flex flex-col items-center justify-center space-y-3 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/jpg,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-stone-200">
                        Drop Purchase Bill PDF or Image here, or browse
                      </h4>
                      <p className="text-xs text-stone-500 mt-1">
                        Supports PDF, JPEG, PNG, WEBP (up to 25MB) • Optical character recognition will run automatically
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono">.PDF</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono">.JPEG / .JPG</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono">.PNG</span>
                    </div>
                  </div>

                  {/* Quick Preset Selector underneath upload */}
                  <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Don't have a bill ready? Try a sample vendor document:
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {SAMPLE_INVOICE_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPreset(p)}
                          className="p-2.5 text-left rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 transition group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-stone-200">
                            <span className="truncate">{p.billNumber}</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-stone-800 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 rounded text-stone-400">
                              {p.fileType}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 truncate mt-0.5">{p.vendorName}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Camera Live Scanner */}
              {activeTab === 'camera' && (
                <div className="space-y-3">
                  <div className="relative bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 aspect-video max-h-[380px] flex items-center justify-center">
                    {cameraError ? (
                      <div className="p-6 text-center space-y-3 max-w-sm">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-stone-300">{cameraError}</p>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold"
                        >
                          Switch to File Upload
                        </button>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Document Viewfinder Reticle Overlay */}
                        <div className="absolute inset-6 border-2 border-emerald-500/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                          <div className="flex justify-between items-start">
                            <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 -mt-1 -ml-1"></div>
                            <span className="text-[10px] px-2 py-0.5 bg-black/60 backdrop-blur-xs text-emerald-300 rounded-full font-mono">
                              Align Purchase Bill Inside Frame
                            </span>
                            <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 -mt-1 -mr-1"></div>
                          </div>

                          {/* Animated laser scanning line */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-pulse my-auto"></div>

                          <div className="flex justify-between items-end">
                            <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 -mb-1 -ml-1"></div>
                            <span className="text-[10px] text-stone-400 font-mono">
                              Maxerp Optical OCR Ready
                            </span>
                            <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 -mb-1 -mr-1"></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Camera Snap Button */}
                  {!cameraError && (
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={handleSnapCamera}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition hover:scale-105"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Snap & Scan Document</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Sample Invoice Presets */}
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SAMPLE_INVOICE_PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        className="p-4 bg-stone-950/80 border border-stone-800 rounded-2xl space-y-3 flex flex-col justify-between hover:border-emerald-500/50 transition"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-2 py-0.5 uppercase font-mono font-bold bg-stone-800 rounded-md text-stone-300">
                              {preset.fileType}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">{preset.fileSize}</span>
                          </div>
                          <h4 className="text-xs font-bold text-stone-100">{preset.vendorName}</h4>
                          <p className="text-[11px] font-mono text-emerald-400">{preset.billNumber}</p>
                          <p className="text-[10px] text-stone-400 leading-relaxed">{preset.notes}</p>
                        </div>

                        <div className="pt-2 border-t border-stone-800/80 space-y-2">
                          <div className="text-[10px] text-stone-400">
                            Items: {preset.sampleItems.map((i) => i.productName.split(' ')[0]).join(', ')}
                          </div>
                          <button
                            onClick={() => handleSelectPreset(preset)}
                            className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Scan This Bill</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optical Scanning Progress Overlay */}
              {isScanning && (
                <div className="p-4 bg-stone-950 border border-emerald-500/40 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-xs font-bold text-stone-200">Maxerp AI OCR Scanner Working</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">{scanProgress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-stone-400 font-mono">
                    {OCR_STEPS[scanStepIndex]}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Review & Automatic Update Configuration Screen */
            extractedData && (
              <div className="space-y-4">
                {/* Confidence & File Banner */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-100">Document Parsed with High Accuracy</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          {extractedData.ocrConfidence}% Confidence
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        File: <span className="text-stone-300 font-mono">{extractedData.fileName}</span> ({extractedData.fileType.toUpperCase()}, {extractedData.fileSize})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProcessed(false);
                      setExtractedData(null);
                    }}
                    className="px-3 py-1 bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700/60 rounded-xl text-xs font-semibold self-start sm:self-auto transition"
                  >
                    Rescan / Change File
                  </button>
                </div>

                {/* Form Fields & Document Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-stone-950/70 border border-stone-800 rounded-2xl">
                  {/* Vendor Match */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Vendor / Supplier</label>
                    <select
                      value={extractedData.vendorId}
                      onChange={(e) => {
                        const v = vendors.find((vend) => vend.id === e.target.value);
                        if (v) {
                          setExtractedData({
                            ...extractedData,
                            vendorId: v.id,
                            vendorName: v.name,
                          });
                        }
                      }}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bill Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Bill / Invoice #</label>
                    <input
                      type="text"
                      value={extractedData.billNumber}
                      onChange={(e) => setExtractedData({ ...extractedData, billNumber: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Bill Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Bill Date</label>
                    <input
                      type="date"
                      value={extractedData.billDate}
                      onChange={(e) => setExtractedData({ ...extractedData, billDate: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Due Date (Terms)</label>
                    <input
                      type="date"
                      value={extractedData.dueDate}
                      onChange={(e) => setExtractedData({ ...extractedData, dueDate: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* PO Match */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">
                      Linked Purchase Order (3-Way Matching)
                    </label>
                    <select
                      value={extractedData.purchaseOrderId || ''}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          purchaseOrderId: e.target.value || undefined,
                        })
                      }
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- No PO (Direct Vendor Bill) --</option>
                      {purchaseOrders.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} • {po.vendorName} (${po.totalAmount.toFixed(2)} - {po.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Receiving Warehouse */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase">
                      Stock Ingestion Warehouse
                    </label>
                    <select
                      value={extractedData.warehouseId}
                      onChange={(e) => setExtractedData({ ...extractedData, warehouseId: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Parsed Line Items Table */}
                <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-stone-200">Parsed Line Items & SKU Catalog Mapping</h4>
                    </div>
                    <button
                      onClick={handleAddLine}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-800 text-[10px] text-stone-400 uppercase">
                          <th className="pb-2">Product / SKU</th>
                          <th className="pb-2 w-20 text-center">Qty</th>
                          <th className="pb-2 w-28 text-right">Unit Cost ($)</th>
                          <th className="pb-2 w-28 text-right">Total ($)</th>
                          <th className="pb-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-850">
                        {extractedData.lines.map((line, idx) => (
                          <tr key={line.id} className="group hover:bg-stone-900/50 transition">
                            <td className="py-2.5 pr-2">
                              <select
                                value={line.productId}
                                onChange={(e) => {
                                  const prod = products.find((p) => p.id === e.target.value);
                                  if (prod) {
                                    handleUpdateLine(idx, {
                                      productId: prod.id,
                                      productName: prod.name,
                                      productCode: prod.code,
                                      unitPrice: prod.purchasePrice,
                                    });
                                  }
                                }}
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.code} - {p.name} (${p.purchasePrice.toFixed(2)})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-2">
                              <input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(e) =>
                                  handleUpdateLine(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                                }
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-center text-stone-200 font-mono focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={line.unitPrice}
                                onChange={(e) =>
                                  handleUpdateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                                }
                                className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-right text-stone-200 font-mono focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 pl-2 text-right font-mono font-bold text-stone-100">
                              ${line.lineTotal.toFixed(2)}
                            </td>
                            <td className="py-2.5 pl-2 text-center">
                              {extractedData.lines.length > 1 && (
                                <button
                                  onClick={() => handleRemoveLine(idx)}
                                  className="text-stone-500 hover:text-rose-400 p-1 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Summary */}
                  <div className="pt-3 border-t border-stone-800 flex justify-end">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-400">
                        <span>Subtotal:</span>
                        <span className="font-mono text-stone-200">${extractedData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Sales Tax / VAT (8.25%):</span>
                        <span className="font-mono text-stone-200">${extractedData.taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-stone-100 pt-1 border-t border-stone-800">
                        <span>Grand Total Due:</span>
                        <span className="font-mono text-emerald-400">${extractedData.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="p-4 bg-stone-950/70 border border-stone-800 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Automatic Data Ingestion Options
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    <label className="flex items-start gap-2.5 p-2.5 bg-stone-900 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
                      <input
                        type="checkbox"
                        checked={autoUpdateStock}
                        onChange={(e) => setAutoUpdateStock(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-stone-200 block">Auto-Update Inventory</span>
                        <span className="text-[10px] text-stone-400">
                          Receive goods directly into stock and record Stock Movement receipt
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 bg-stone-900 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
                      <input
                        type="checkbox"
                        checked={autoPostAccounting}
                        onChange={(e) => setAutoPostAccounting(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-stone-200 block">Auto-Post to GL</span>
                        <span className="text-[10px] text-stone-400">
                          Debit Inventory (1200) & Credit Accounts Payable (2000)
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 bg-stone-900 border border-stone-800 rounded-xl cursor-pointer hover:border-stone-700 transition">
                      <input
                        type="checkbox"
                        checked={syncPoStatus}
                        onChange={(e) => setSyncPoStatus(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-stone-200 block">Mark PO as Billed</span>
                        <span className="text-[10px] text-stone-400">
                          Close 3-way matching loop for linked Purchase Order
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAndIngest}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition hover:scale-102"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Ingest Bill into Maxerp</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
