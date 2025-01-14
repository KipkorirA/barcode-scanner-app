import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library'; // Import ZXing
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
  const [isScannerActive, setIsScannerActive] = useState(true);
  const scannerRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader()); // ZXing reader
  const videoStreamRef = useRef(null); // To track video stream initialization

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
      setProductDetails(data.records.length > 0 ? data.records[0].fields : null);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to fetch product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startScanner = () => {
    setIsScannerActive(true);
    setError(null);
  
    if (!scannerRef.current) {
      setError('Scanner container is not initialized.');
      return;
    }
  
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not supported on this device or browser.');
      return;
    }
  
    // Check if video stream is already active
    if (videoStreamRef.current) {
      console.log('Video stream already started');
      return; // Prevent re-initialization
    }
  
    // Request back camera (facingMode: environment)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } }) // Ensuring the back camera is used
      .then((stream) => {
        if (scannerRef.current) {
          console.log('Initializing ZXing with video element...');
          videoStreamRef.current = stream; // Save the video stream reference
          scannerRef.current.srcObject = stream; // Set the video element to show the stream
  
          // Start ZXing reader and keep scanning continuously
          const scanFrame = () => {
            codeReader.current
              .decodeFromVideoDevice(null, scannerRef.current)
              .then((result) => {
                if (result) {
                  setBarcode(result.getText());
                  setIsScannerActive(false);
                  codeReader.current.reset(); // Stop scanning after successful scan
                }
              })
              .catch((err) => {
                // Ignore errors related to no barcode found and keep scanning
                if (err && !(err instanceof ZXing.NotFoundException)) {
                  console.error('Decoding error:', err);
                }
              });

            // Keep scanning
            if (isScannerActive) {
              requestAnimationFrame(scanFrame);
            }
          };

          // Start the scanning loop
          scanFrame();
        }
      })
      .catch((err) => {
        console.error('Camera access denied:', err.message);
        if (err.name === 'NotAllowedError') {
          setError('Camera access was denied. Please allow camera access in your browser settings.\nTip: Go to browser settings and enable camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('An unexpected error occurred while accessing the camera.');
        }
      });
  };
  

  const resetScanner = () => {
    setBarcode('');
    setProductDetails(null);
    setError(null);
    setIsScannerActive(true);
    
    // Stop current video stream if it's active
    if (videoStreamRef.current) {
      const tracks = videoStreamRef.current.getTracks();
      tracks.forEach(track => track.stop()); // Stop all tracks
    }
    videoStreamRef.current = null; // Clear video stream reference

    // Reset ZXing reader state and start scanner again
    codeReader.current.reset();
    startScanner(); // Restart scanner
  };

  useEffect(() => {
    if (scannerRef.current) {
      console.log('Ref is initialized, starting scanner...');
      startScanner();
    } else {
      console.log('Ref not initialized yet...');
    }
  }, []); // Empty dependency array ensures this only runs once after initial render

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
              ref={scannerRef} // This is the video element for ZXing
              className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 border-2 border-blue-500 opacity-50 pointer-events-none" />
          </div>
        )}
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

      {!isScannerActive && !productDetails && !isLoading && (
        <Button 
          onClick={resetScanner}
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
