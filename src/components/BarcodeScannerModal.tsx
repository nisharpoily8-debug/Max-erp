import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Barcode,
  X,
  CheckCircle2,
  AlertTriangle,
  Search,
  Zap,
  ZapOff,
  SwitchCamera,
  Volume2,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { Product } from '../types';

export interface BarcodeScanValidationResult {
  valid: boolean;
  message?: string;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductFound?: (product: Product, extra?: { mainStock: number; eastStock: number; scannedQty?: number }) => void;
  title?: string;
  subtitle?: string;
  mode?: 'lookup' | 'receive' | 'delivery' | 'adjust' | 'count';
  allowedProductIds?: string[];
  validateScan?: (product: Product) => BarcodeScanValidationResult;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductFound,
  title = 'Android Camera Barcode Scanner',
  subtitle = 'High-speed hardware camera & barcode reader',
  mode = 'lookup',
  allowedProductIds,
  validateScan,
}) => {
  const { products, stockLevels, warehouses } = useErp();

  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{
    product: Product;
    mainStock: number;
    eastStock: number;
    validation: BarcodeScanValidationResult;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [beepFeedback, setBeepFeedback] = useState<boolean>(false);

  // Play audio/haptic feedback
  const triggerScanFeedback = () => {
    setBeepFeedback(true);
    setTimeout(() => setBeepFeedback(false), 300);

    // Browser vibration if supported (Android device)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch (e) {
        // Ignore vibration failure
      }
    }
  };

  // Start Camera Stream when modal opens
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      setScanResult(null);
      setScanError(null);
      setCameraError(null);

      const startCamera = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
              setCameraActive(true);
            }
          } else {
            setCameraError('Camera API not accessible in this browser context.');
          }
        } catch (err: any) {
          console.warn('Camera access error:', err);
          setCameraError('Camera access denied or unavailable. Fallback simulator active.');
          setCameraActive(false);
        }
      };

      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    };
  }, [isOpen, facingMode]);

  // Barcode Detection Loop (Native BarcodeDetector API if available)
  useEffect(() => {
    let animationFrameId: number;
    let detector: any = null;

    if (cameraActive && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        // @ts-ignore
        detector = new window.BarcodeDetector({
          formats: ['ean_13', 'code_128', 'qr_code', 'upc_a', 'data_matrix'],
        });
      } catch (e) {
        detector = null;
      }
    }

    const checkFrame = async () => {
      if (detector && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            if (code) {
              handleProcessBarcode(code);
            }
          }
        } catch (e) {
          // Frame error
        }
      }
      if (isOpen && cameraActive) {
        animationFrameId = requestAnimationFrame(checkFrame);
      }
    };

    if (detector && cameraActive) {
      animationFrameId = requestAnimationFrame(checkFrame);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, isOpen]);

  // Toggle Torch if stream track supports it
  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = track.getCapabilities?.() as any;
          if (capabilities && capabilities.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: !torchOn }],
            });
            setTorchOn(!torchOn);
          } else {
            setTorchOn(!torchOn);
          }
        } catch (e) {
          setTorchOn(!torchOn);
        }
      }
    }
  };

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Core Barcode Processor
  const handleProcessBarcode = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    triggerScanFeedback();

    const found = products.find(
      (p) =>
        p.barcode === cleanCode ||
        p.code.toLowerCase() === cleanCode.toLowerCase() ||
        p.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      // Validate with allowed products if provided
      let validation: BarcodeScanValidationResult = { valid: true };
      if (allowedProductIds && !allowedProductIds.includes(found.id)) {
        validation = {
          valid: false,
          message: `Product ${found.name} (${found.code}) is not scheduled on this order!`,
        };
      } else if (validateScan) {
        validation = validateScan(found);
      }

      const mainStock = stockLevels.find((s) => s.productId === found.id && s.warehouseId === 'wh-main');
      const eastStock = stockLevels.find((s) => s.productId === found.id && s.warehouseId === 'wh-east');

      setScanResult({
        product: found,
        mainStock: mainStock?.onHand || 0,
        eastStock: eastStock?.onHand || 0,
        validation,
      });
      setScanError(null);

      // If valid, notify parent
      if (validation.valid && onProductFound) {
        onProductFound(found, {
          mainStock: mainStock?.onHand || 0,
          eastStock: eastStock?.onHand || 0,
          scannedQty: 1,
        });
      }
    } else {
      setScanResult(null);
      setScanError(`Unrecognized SKU/Barcode: "${cleanCode}". Product not registered in database.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                beepFeedback
                  ? 'bg-emerald-400 text-stone-950 shadow-lg shadow-emerald-500/50'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-100">{title}</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {mode}
                </span>
              </div>
              <p className="text-xs text-stone-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          <div className="relative aspect-4/3 bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-inner flex flex-col items-center justify-center">
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* Fallback Viewfinder when Camera is initializing / denied */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-950/90 space-y-2">
                <Camera className="w-10 h-10 text-stone-600" />
                <p className="text-xs font-semibold text-stone-300">
                  {cameraError || 'Initializing device camera feed...'}
                </p>
                <p className="text-[11px] text-stone-500">
                  You can also tap any of the product barcodes below or enter a SKU code.
                </p>
              </div>
            )}

            {/* Overlay Viewfinder Laser & Reticle */}
            <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_14px_#34d399] animate-pulse z-10" />

            {/* Corner brackets for visual alignment */}
            <div className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg pointer-events-none z-10" />
            <div className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg pointer-events-none z-10" />
            <div className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg pointer-events-none z-10" />
            <div className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2 border-emerald-400 rounded-br-lg pointer-events-none z-10" />

            {/* Camera Floating Controls */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto z-20">
              <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-emerald-300">
                {cameraActive ? 'CAMERA STREAM ACTIVE' : 'SIMULATION MODE'}
              </span>

              <div className="flex gap-1.5">
                <button
                  onClick={toggleTorch}
                  title="Toggle Torch/Flash"
                  className={`p-1.5 rounded-lg text-xs backdrop-blur-md transition ${
                    torchOn ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-black/60 text-stone-300 hover:text-white'
                  }`}
                >
                  {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={toggleFacingMode}
                  title="Switch Camera"
                  className="p-1.5 bg-black/60 backdrop-blur-md text-stone-300 hover:text-white rounded-lg text-xs transition"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Validation or Error Alert */}
          {scanError && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-start gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Scan Recognition Result Card */}
          {scanResult && (
            <div
              className={`p-3.5 rounded-2xl border transition space-y-2.5 ${
                scanResult.validation.valid
                  ? 'bg-emerald-950/40 border-emerald-500/40'
                  : 'bg-amber-950/40 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    scanResult.validation.valid ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {scanResult.validation.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> SKU Recognized & Validated
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" /> Validation Warning
                    </>
                  )}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-950 text-stone-300">
                  {scanResult.product.code}
                </span>
              </div>

              {!scanResult.validation.valid && scanResult.validation.message && (
                <p className="text-xs text-amber-200 bg-amber-950/60 p-2 rounded-xl">
                  {scanResult.validation.message}
                </p>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-stone-100">{scanResult.product.name}</h4>
                  <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                    Barcode: {scanResult.product.barcode}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    ${scanResult.product.sellingPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 block">per {scanResult.product.unit}</span>
                </div>
              </div>

              {/* Warehouse Inventory Stock Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950/70 p-2.5 rounded-xl border border-stone-800">
                <div>
                  <span className="text-stone-400 text-[10px] block">Central Warehouse Stock</span>
                  <span className="font-bold text-stone-200">
                    {scanResult.mainStock} {scanResult.product.unit}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">East Coast Hub Stock</span>
                  <span className="font-bold text-stone-200">
                    {scanResult.eastStock} {scanResult.product.unit}
                  </span>
                </div>
              </div>

              {scanResult.validation.valid && (
                <button
                  onClick={() => {
                    if (onProductFound) {
                      onProductFound(scanResult.product, {
                        mainStock: scanResult.mainStock,
                        eastStock: scanResult.eastStock,
                      });
                    }
                    onClose();
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>Confirm Selection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Tap Simulation Barcode Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-stone-400 font-medium">Quick SKU Barcode Test Strips:</label>
              <span className="text-[10px] text-stone-500">Tap to test scan</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProcessBarcode(p.barcode)}
                  className="p-2 text-left bg-stone-800/80 hover:bg-stone-750 border border-stone-700/60 rounded-xl transition text-xs group"
                >
                  <p className="font-semibold text-stone-200 truncate group-hover:text-emerald-400">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{p.barcode}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <div className="pt-2 border-t border-stone-800">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or manually enter barcode / SKU..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProcessBarcode(manualCode);
                }}
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 font-mono"
              />
              <button
                onClick={() => handleProcessBarcode(manualCode)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Search className="w-3.5 h-3.5" />
                Process
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
