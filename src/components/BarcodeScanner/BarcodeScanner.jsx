import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Circles } from 'react-loader-spinner';
import ScannerUI from './ScannerUI';
import ProductCard from './ProductCard';
import ScannerControlButtons from './ScannerControlButtons';
import { Alert, AlertDescription } from '../ui/Alert';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import PropTypes from 'prop-types';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  const scannerContainerRef = useRef(null);
  const qrCodeScannerRef = useRef(null);

  const API_KEY = import.meta.env.VITE_APP_API_KEY || 'default-api-key';
  const API_BASE_URL = 'https://api.airtable.com/v0/appJwvb3ld1PgjbVj';
  const TABLE_ID = 'tblRb8tVYVmjyY2Tq';
  const BARCODE_FIELD_ID = 'fldBARCODE';

  const fetchProductDetails = useCallback(async (barcodeValue) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/${TABLE_ID}?filterByFormula=${encodeURIComponent(`{${BARCODE_FIELD_ID}}="${barcodeValue}"`)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.records && data.records.length > 0) {
        setProductDetails(data.records[0].fields);
      } else {
        setProductDetails(null);
      }
    } catch (fetchError) {
      setError('Failed to fetch product details.');
      console.error('Fetch error:', fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [API_KEY]);

  const startScanner = useCallback(() => {
    if (isScannerActive || barcode) return;

    setIsScannerActive(true);
    setError(null);
    setScanStatus('Initializing camera...');

    if (!scannerContainerRef.current) {
      setError('Scanner container not found.');
      return;
    }

    try {
      qrCodeScannerRef.current = new Html5QrcodeScanner(
        scannerContainerRef.current.id,
        {
          fps: 5,
          qrbox: 250,
          supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        false
      );

      qrCodeScannerRef.current.render(
        (decodedText) => {
          if (!barcode) {
            setBarcode(decodedText);
            fetchProductDetails(decodedText);
          }
        },
        (scanError) => {
          console.error('Scanning error:', scanError);
        }
      );
    } catch (err) {
      setError('Failed to initialize scanner.');
      console.error('Scanner initialization failed:', err);
    }
  }, [barcode, fetchProductDetails, isScannerActive]);

  const resetScanner = useCallback(() => {
    setBarcode('');
    setProductDetails(null);
    setError(null);
    setScanStatus('');
    setIsScannerActive(false);

    if (qrCodeScannerRef.current) {
      qrCodeScannerRef.current.clear().catch((clearError) => {
        console.error('Error clearing scanner:', clearError);
      });
      qrCodeScannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !barcode) {
      startScanner();
    }
  }, [isLoading, barcode, startScanner]);

  useEffect(() => {
    return () => resetScanner();
  }, [resetScanner]);

  const handleReset = () => {
    resetScanner();
    startScanner();
  };

  return (
    <div className="max-w-md mx-auto p-8 space-y-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">Barcode Scanner</h1>
        {!isLoading && !productDetails && (
          <ScannerUI
            isScannerActive={isScannerActive}
            scanStatus={scanStatus}
            startScanner={startScanner}
          />
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="border-2 border-red-200 animate-pulse">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-inner" aria-label="Loading">
          <Circles color="#4f46e5" height={80} width={80} />
        </div>
      ) : (
        <>
          {barcode && !isScannerActive && (
            <div className="transition-all duration-300 ease-in-out transform hover:scale-102">
              <ScannerControlButtons onReset={handleReset} />
            </div>
          )}
          {productDetails ? (
            <div className="transition-all duration-300 ease-in-out transform hover:scale-102">
              <ProductCard product={productDetails} />
            </div>
          ) : (
            barcode && (
              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <AlertDescription className="text-blue-700 font-medium">
                  No product found for barcode: {barcode}
                </AlertDescription>
              </Alert>
            )
          )}
        </>
      )}

      <div 
        id="scanner-container" 
        ref={scannerContainerRef}
        className="mt-6 rounded-xl overflow-hidden shadow-inner bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
      ></div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white py-8 flex items-center justify-center">
        <BarcodeScanner />
      </div>
    </ErrorBoundary>
  );
}