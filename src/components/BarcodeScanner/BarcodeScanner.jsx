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
      return <h1 className="text-2xl font-bold text-red-600 text-center p-6 bg-gradient-to-r from-red-100 to-red-100 rounded-xl shadow-lg border border-red-200 animate-pulse">System Error. Please contact IT support.</h1>;
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
  const TABLE_ID = 'tblRb8tVYVmjyY2Tq';
  const BARCODE_FIELD_ID = 'fldg7ScmPnlhg1MJX';
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
        setError('Medical item not found in database.');
      }
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      setError(`Failed to fetch medical item details: ${fetchError.message}`);
      console.error('Fetch error:', fetchError);
    }
  }, [API_KEY]);

  const handleBarcodeDetection = useCallback((decodedText) => {
    const currentTime = Date.now();

    if (!scannedBarcodes.current.has(decodedText) && currentTime - lastScannedTime > SCAN_COOLDOWN) {
      scannedBarcodes.current.add(decodedText);
      setLastScannedTime(currentTime);
      setBarcode(decodedText);
      setScanStatus(`Item Code detected: ${decodedText}`);
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
    setScanStatus('Initializing scanner...');

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
    setScanStatus('Scanning for medical items...');
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-blue-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-teal-100 transition-all duration-300 hover:shadow-3xl">
        <div className="p-6">
          <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent tracking-tight text-center">
            AGC Tenwek Hospital Inventory Scanner
          </h1>
          
          <div className="relative">
            <div className="text-center mb-4 text-teal-600 font-semibold">
              Please place the barcode within the scanning area below
            </div>
            <div className="relative">
              <div id="reader" className="w-full rounded-2xl overflow-hidden shadow-lg border-4 border-teal-200 transition-all duration-300 hover:border-teal-300"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-2xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-48 h-24 border-2 border-teal-400 rounded-lg animate-pulse"></div>
                <div className="text-sm text-teal-600 bg-white/80 px-2 py-1 rounded mt-2 text-center">
                  Center barcode here
                </div>
              </div>
            </div>
          </div>

          <ScannerUI 
            isScannerActive={isScannerActive} 
            scanStatus={scanStatus} 
            startScanner={startScanner}
            resetScanner={resetScanner}
          />
            
          <div className="flex justify-center">
            <button 
              onClick={pauseScanner} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
            >
              Stop Scanning
            </button>
          </div>

          <div className="space-y-4 mt-6">
            {barcode && (
              <Alert className="bg-teal-50 border-2 border-teal-200 shadow-md rounded-xl">
                <AlertDescription className="font-medium text-teal-800">
                  Medical Item Code: {barcode}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-50 border-2 border-red-200 animate-pulse shadow-md rounded-xl">
                <AlertDescription className="font-medium text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {barcode && productDetails && (
              <div className="transform transition-all duration-300 hover:scale-102">
                <ProductCard product={productDetails} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;