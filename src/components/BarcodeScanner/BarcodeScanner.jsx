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
      return <h1 className="text-2xl font-bold text-red-600 text-center p-4 bg-red-100 rounded-lg shadow-md">Something went wrong. Please refresh the page.</h1>;
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
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 tracking-tight">Barcode Scanner</h1>
        {!isLoading && !productDetails && (
          <ScannerUI
            isScannerActive={isScannerActive}
            scanStatus={scanStatus}
            startScanner={startScanner}
          />
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="border-2 border-red-200">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center p-6 bg-gray-50 rounded-lg" aria-label="Loading">
          <Circles color="#3b82f6" height={60} width={60} />
        </div>
      ) : (
        <>
          {barcode && !isScannerActive && (
            <div className="transition-all duration-300 ease-in-out">
              <ScannerControlButtons onReset={handleReset} />
            </div>
          )}
          {productDetails ? (
            <div className="transition-all duration-300 ease-in-out">
              <ProductCard product={productDetails} />
            </div>
          ) : (
            barcode && (
              <Alert className="bg-blue-50 border border-blue-200">
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
        className="mt-6 rounded-lg overflow-hidden shadow-inner bg-gray-50"
      ></div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 py-8 flex items-center justify-center">
        <BarcodeScanner />
      </div>
    </ErrorBoundary>
  );
}