import React, { useRef, useEffect, useState, useCallback } from 'react';
import ScannerUI from './ScannerUI';
import ProductCard from './ProductCard';
import { Alert, AlertDescription } from '../ui/Alert';
import PropTypes from 'prop-types';
import { Html5QrcodeScanner } from 'html5-qrcode';

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

  const scannerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const scannedBarcodes = useRef(new Set());

  const API_KEY = import.meta.env.VITE_APP_API_KEY || 'default-api-key';
  const API_BASE_URL = 'https://api.airtable.com/v0/appJwvb3ld1PgjbVj';
  const TABLE_ID = 'tblz1Wi8XLNwMHRpz';
  const BARCODE_FIELD_ID = 'fldqPTazwJiSEa9zx';
  const SCAN_COOLDOWN = 400;

  const resetScanner = useCallback(() => {
    setBarcode('');
    setProductDetails(null);
    setError(null);
    setIsScannerActive(false);
    setScanStatus('');
    scannedBarcodes.current.clear();
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
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

  const handleBarcodeDetection = useCallback((decodedText) => {
    const currentTime = Date.now();

    if (!scannedBarcodes.current.has(decodedText) && currentTime - lastScannedTime > SCAN_COOLDOWN) {
      scannedBarcodes.current.add(decodedText);
      setLastScannedTime(currentTime);
      setBarcode(decodedText);
      setScanStatus(`Barcode detected: ${decodedText}`);
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      setTimeout(() => {
        fetchProductDetails(decodedText);
      }, 1000);
    }
  }, [fetchProductDetails, lastScannedTime, SCAN_COOLDOWN]);

  const startScanner = useCallback(() => {
    if (isScannerActive || barcode) return;

    setIsScannerActive(true);
    setError(null);
    setScanStatus('Initializing camera...');

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true
      },
      false
    );

    html5QrcodeScanner.render((decodedText) => {
      handleBarcodeDetection(decodedText);
    }, (error) => {
      console.warn(`Code scan error = ${error}`);
    });

    scannerRef.current = html5QrcodeScanner;
    setScanStatus('Scanning for barcodes...');
  }, [barcode, handleBarcodeDetection, isScannerActive]);

  const pauseScanner = () => {
    setIsScannerActive(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
  };

  useEffect(() => {
    return () => {
      pauseScanner();
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

      {barcode && (
        <Alert className="border-2 border-blue-200">
          <AlertDescription className="font-medium">Scanned Barcode: {barcode}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="border-2 border-red-200 animate-pulse">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {barcode && productDetails && <ProductCard product={productDetails} />}

      <div id="reader" className="w-full"></div>
    </div>
  );
};

export default BarcodeScanner;