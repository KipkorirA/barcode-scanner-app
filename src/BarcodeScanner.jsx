import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Circles } from 'react-loader-spinner';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Camera, RefreshCw } from 'lucide-react';

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const scannerRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const videoStreamRef = useRef(null);
  const isScanningRef = useRef(false);
  const requestIdRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
  const API_KEY = import.meta.env.VITE_APP_API_KEY;
  const BASE_ID = import.meta.env.VITE_APP_BASE_ID;
  const TABLE_NAME = import.meta.env.VITE_APP_TABLE_NAME;

  const fetchProductDetails = async (barcodeValue) => {
    setIsLoading(true);
    setError(null);

    const sanitizedBarcode = barcodeValue.trim();

    try {
      const url = `${API_BASE_URL}/${BASE_ID}/${TABLE_NAME}?filterByFormula=({BARCODE}="${sanitizedBarcode}")`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.records.length > 0) {
        setProductDetails(data.records[0].fields);
      } else {
        setError(`No product found for barcode: ${barcodeValue}`);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to fetch product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startScanner = () => {
    if (barcode || !isScannerActive || isScanningRef.current) return;

    isScanningRef.current = true;
    setScanStatus('Scanning...');
    setError(null);

    if (!scannerRef.current) {
      setError('Scanner container is not initialized.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not supported on this device or browser.');
      return;
    }

    if (!videoStreamRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (scannerRef.current) {
            videoStreamRef.current = stream;
            scannerRef.current.srcObject = stream;

            const scanFrame = () => {
              if (barcode || !isScannerActive) {
                setScanStatus('Scan finished.');
                cancelAnimationFrame(requestIdRef.current);
                return;
              }

              codeReader.current
                .decodeFromVideoDevice(null, scannerRef.current)
                .then((result) => {
                  if (result && !barcode) {
                    setBarcode(result.getText());
                    setIsScannerActive(false);
                    isScanningRef.current = false;
                    setScanStatus('Scan finished.');
                    codeReader.current.reset();
                    cancelAnimationFrame(requestIdRef.current);
                  }
                })
                .catch((err) => {
                  if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Decoding error:', err);
                  }
                });

              if (isScannerActive && !barcode) {
                requestIdRef.current = requestAnimationFrame(scanFrame);
              }
            };

            scanFrame();
          }
        })
        .catch((err) => {
          console.error('Camera access denied:', err.message);
          if (err.name === 'NotAllowedError') {
            setError('Camera access was denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else if (err.name === 'NotReadableError') {
            setError('Camera is already in use by another application.');
          } else {
            setError('An unexpected error occurred while accessing the camera.');
          }
        });
    } else {
      console.log('Camera is already active.');
    }
  };

  const resetScanner = () => {
    setBarcode('');
    setProductDetails(null);
    setError(null);
    setScanStatus('');
    setIsScannerActive(false);
    isScanningRef.current = false;

    if (videoStreamRef.current) {
      const tracks = videoStreamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
    }
    videoStreamRef.current = null;

    codeReader.current.reset();
    cancelAnimationFrame(requestIdRef.current);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (barcode) {
      const timeout = setTimeout(() => fetchProductDetails(barcode), 500);
      return () => clearTimeout(timeout);
    }
  }, [barcode]);

  const ProductCard = ({ product }) => (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Product Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(product).map(([key, value]) => (
          value && (
            <div key={key} className="flex justify-between border-b pb-2">
              <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
              <span className="text-right">{value}</span>
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Barcode Scanner</h1>
        {isScannerActive && (
          <div className="relative">
            <video
              ref={scannerRef}
              className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 border-2 border-blue-500 opacity-50 pointer-events-none" />
          </div>
        )}
        {scanStatus && <div className="mt-2 text-lg">{scanStatus}</div>}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Circles color="#3b82f6" height={60} width={60} />
        </div>
      ) : (
        <>
          {barcode && !isScannerActive && (
            <Button
              onClick={resetScanner}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Scan Another Barcode
            </Button>
          )}

          {productDetails ? (
            <ProductCard product={productDetails} />
          ) : barcode && (
            <Alert>
              <AlertDescription>No product found for barcode: {barcode}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {!isScannerActive && !barcode && !isLoading && (
        <Button
          onClick={() => setIsScannerActive(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Start Scanning
        </Button>
      )}
    </div>
  );
};

export default BarcodeScanner;
