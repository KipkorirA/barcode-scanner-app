import React, { useRef, useEffect, useState, useCallback } from 'react';
import ScannerUI from './ScannerUI';
import ProductCard from './ProductCard';
import { Alert, AlertDescription } from '../ui/Alert';
import PropTypes from 'prop-types';
import * as ZXing from '@zxing/library';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught in boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1 className="text-2xl font-bold text-red-600 text-center p-6 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl shadow-lg border border-red-200 animate-pulse">Something went wrong. Please refresh the page.</h1>;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [lastScannedTime, setLastScannedTime] = useState(0);

  const videoRef = useRef(null);
  const abortControllerRef = useRef(null);
  const codeReaderRef = useRef(null);
  const scannedBarcodes = useRef(new Set());

  const API_KEY = import.meta.env.VITE_APP_API_KEY || 'default-api-key';
  const API_BASE_URL = 'https://api.airtable.com/v0/appJwvb3ld1PgjbVj';
  const TABLE_ID = 'tblRb8tVYVmjyY2Tq';
  const BARCODE_FIELD_ID = 'fldg7ScmPnlhg1MJX';
  const SCAN_COOLDOWN = 400; // Reduced cooldown time

  const resetScanner = useCallback(() => {
    setBarcode('');
    setProductDetails(null);
    setError(null);
    setIsScannerActive(false);
    setScanStatus('');
    scannedBarcodes.current.clear();
  }, []);

  const fetchProductDetails = useCallback(async (barcodeValue) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);

    try {
      const formula = `{${BARCODE_FIELD_ID}} = "${barcodeValue.trim()}"`;
      const url = `${API_BASE_URL}/${TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.records && data.records.length > 0) {
        setProductDetails(data.records[0].fields);
      } else {
        setProductDetails(null);
        setError('Product not found in database.');
      }
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      setError(`Failed to fetch product details: ${fetchError.message}`);
      console.error('Fetch error:', fetchError);
    }
  }, [API_KEY]);

  const handleBarcodeDetection = useCallback((result) => {
    if (result) {
      const decodedText = result.text;
      const currentTime = Date.now();

      if (!scannedBarcodes.current.has(decodedText) && currentTime - lastScannedTime > SCAN_COOLDOWN) {
        scannedBarcodes.current.add(decodedText);
        setLastScannedTime(currentTime);
        setBarcode(decodedText);
        fetchProductDetails(decodedText);
        setScanStatus('Barcode detected!');
        if (navigator.vibrate) {
          navigator.vibrate(100); // Simplified vibration pattern
        }
      }
    }
  }, [fetchProductDetails, lastScannedTime, SCAN_COOLDOWN]);

  const startScanner = useCallback(() => {
    if (isScannerActive || barcode) return;

    setIsScannerActive(true);
    setError(null);
    setScanStatus('Initializing camera...');

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 }, // Increased resolution
          height: { ideal: 720 },
          frameRate: { ideal: 30 } // Specified frame rate
        },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setScanStatus('Scanning for barcodes...');
        }

        if ('BarcodeDetector' in window) {
          const nativeBarcodeDetector = new window.BarcodeDetector({ formats: ['code_128'] });
          const detectBarcodes = () => {
            if (!videoRef.current || !isScannerActive) return;
            
            nativeBarcodeDetector
              .detect(videoRef.current)
              .then((barcodes) => {
                if (barcodes.length > 0) {
                  handleBarcodeDetection({ text: barcodes[0].rawValue });
                }
                if (isScannerActive) requestAnimationFrame(detectBarcodes);
              })
              .catch((err) => console.error('Barcode detection error:', err));
          };
          requestAnimationFrame(detectBarcodes);
        } else {
          const hints = new Map();
          hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
          hints.set(ZXing.DecodeHintType.ASSUME_GS1, false);
          
          codeReaderRef.current = new ZXing.BrowserMultiFormatReader(hints);
          codeReaderRef.current.timeBetweenDecodingAttempts = 50; // Reduced time between attempts
          codeReaderRef.current.decodeFromVideoElement(videoRef.current, handleBarcodeDetection);
        }
      })
      .catch((err) => {
        setError(`Failed to initialize camera: ${err.message}`);
        console.error('Camera error:', err);
        setIsScannerActive(false);
      });
  }, [barcode, handleBarcodeDetection, isScannerActive]);

  const pauseScanner = () => {
    setIsScannerActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    return () => {
      pauseScanner();
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto p-4 space-y-3 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Barcode Scanner</h1>
        <ScannerUI 
          isScannerActive={isScannerActive} 
          scanStatus={scanStatus} 
          startScanner={startScanner}
          resetScanner={resetScanner}
        />
        <button onClick={pauseScanner} className="bg-red-500 text-white px-4 py-2 rounded">
          Pause Scanner
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="border-2 border-red-200 animate-pulse">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {barcode && productDetails && <ProductCard product={productDetails} />}

      <video 
        ref={videoRef} 
        className="w-full rounded-xl shadow-lg" 
        muted 
        playsInline 
        style={{ display: isScannerActive ? 'block' : 'none' }}
      />
    </div>
  );
};

export default BarcodeScanner;