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

  const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
  const AIRTABLE_API_URL = import.meta.env.VITE_AIRTABLE_API_URL;
  const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_ID = import.meta.env.VITE_AIRTABLE_TABLE_ID;
  const AIRTABLE_BARCODE_FIELD_ID = import.meta.env.VITE_AIRTABLE_BARCODE_FIELD_ID;
  const NAVISION_API_URL = import.meta.env.VITE_NAVISION_API_URL;
  const NAVISION_API_KEY = import.meta.env.VITE_NAVISION_API_KEY;
  const NAV_USER = import.meta.env.VITE_NAV_USER;
  const NAV_PASSWORD = import.meta.env.VITE_NAV_PASSWORD;
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

  const fetchFromNavision = useCallback(async (barcodeValue) => {
    try {
      const response = await fetch(`${NAVISION_API_URL}/items/${barcodeValue}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NAVISION_API_KEY}`,
          'Username': NAV_USER,
          'Password': NAV_PASSWORD
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Navision HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Navision fetch error:', error);
      return null;
    }
  }, [NAVISION_API_URL, NAVISION_API_KEY, NAV_USER, NAV_PASSWORD]);

  const fetchFromAirtable = useCallback(async (barcodeValue) => {
    try {
      const formula = `{${AIRTABLE_BARCODE_FIELD_ID}} = "${barcodeValue.trim()}"`;
      const url = `${AIRTABLE_API_URL}/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${encodeURIComponent(formula)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Airtable HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.records && data.records.length > 0 ? data.records[0].fields : null;
    } catch (error) {
      console.error('Airtable fetch error:', error);
      return null;
    }
  }, [AIRTABLE_API_URL, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_BARCODE_FIELD_ID, AIRTABLE_API_KEY]);

  const fetchProductDetails = useCallback(async (barcodeValue) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);

    try {
      // First try Navision
      const navisionData = await fetchFromNavision(barcodeValue);
      if (navisionData) {
        setProductDetails(navisionData);
        return;
      }

      // If Navision fails, try Airtable
      const airtableData = await fetchFromAirtable(barcodeValue);
      if (airtableData) {
        setProductDetails(airtableData);
        return;
      }

      // If both fail, show error
      setProductDetails(null);
      setError('Product not found in either Navision or Airtable.');
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      setError(`Failed to fetch product details: ${fetchError.message}`);
      console.error('Fetch error:', fetchError);
    }
  }, [fetchFromNavision, fetchFromAirtable]);

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
  }, [fetchProductDetails, lastScannedTime]);

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