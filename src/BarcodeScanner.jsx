import { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
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

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
            width: 640,
            height: 480,
            aspectRatio: { min: 1, max: 2 }
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 4,
        decoder: {
          readers: [
            "code_128_reader", 
            "ean_reader", 
            "ean_8_reader", 
            "upc_reader", 
            "upc_e_reader", 
            "code_39_reader", 
            "codabar_reader", 
            "i2of5_reader"
          ],
          debug: {
            drawBoundingBox: true,
            showPattern: true
          }
        },
        locate: true
      },
      (err) => {
        if (err) {
          console.error('Quagga init failed:', err);
          setError('Failed to initialize scanner. Please check camera permissions.');
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      if (code && code.length >= 6) {  // Basic validation
        setBarcode(code);
        setIsScannerActive(false);
        Quagga.stop();
      }
    });
  };

  const resetScanner = () => {
    setBarcode('');
    setProductDetails(null);
    setError(null);
    startScanner();
  };

  useEffect(() => {
    if (barcode) {
      const timeout = setTimeout(() => fetchProductDetails(barcode), 500);
      return () => clearTimeout(timeout);
    }
  }, [barcode]);

  useEffect(() => {
    startScanner();
    return () => {
      Quagga.stop();
    };
  }, []);

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
            <div 
              ref={scannerRef} 
              className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
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