import { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
import { Circles } from 'react-loader-spinner';

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef(null);  // Reference for the video container

  // Access environment variables
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
  const API_KEY = import.meta.env.VITE_APP_API_KEY;
  const BASE_ID = import.meta.env.VITE_APP_BASE_ID;
  const TABLE_NAME = import.meta.env.VITE_APP_TABLE_NAME;

  const fetchProductDetails = async (barcodeValue) => {
    setIsLoading(true);
    setError(null);

    const url = `${API_BASE_URL}/${BASE_ID}/${TABLE_NAME}?filterByFormula=({BARCODE}="${barcodeValue}")`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      });

      const data = await response.json();

      if (data.records.length > 0) {
        setProductDetails(data.records[0].fields);
      } else {
        setProductDetails(null);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to fetch product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (barcode) {
      const timeout = setTimeout(() => fetchProductDetails(barcode), 500);
      return () => clearTimeout(timeout);
    }
  }, [barcode]);

  const startScanner = () => {
    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current, // Video stream target
          constraints: {
            facingMode: "environment", // Use the back camera
          },
        },
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
          ], // Supported barcode formats
        },
      },
      (err) => {
        if (err) {
          console.error('Quagga init failed:', err);
          setError('Failed to initialize scanner.');
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((data) => {
      setBarcode(data.codeResult.code);
      Quagga.stop(); // Stop the scanner after barcode is detected
    });
  };

  useEffect(() => {
    startScanner();

    return () => {
      Quagga.stop();  // Clean up when component unmounts
    };
  }, []);

  const handleScan = (data) => {
    if (data && data.trim() !== '') {
      setBarcode(data);
    } else {
      setError('Invalid barcode detected.');
    }
  };

  const handleError = (err) => {
    console.error('Scanner Error:', err);
    setError('Scanner error. Please try again.');
  };

  return (
    <div className="scanner-container">
      <h1>Barcode Scanner</h1>
      <div
        ref={scannerRef}
        style={{ width: '100%', height: '300px', border: '1px solid black' }}
      ></div>

      {isLoading ? (
        <div style={{ textAlign: 'center' }}>
          <Circles color="#00BFFF" height={80} width={80} />
        </div>
      ) : barcode ? (
        productDetails ? (
          <div>
            <h3>Product Details:</h3>
            <p><strong>BARCODE:</strong> {productDetails['BARCODE']}</p>
            <p><strong>Name:</strong> {productDetails['Name'] || 'N/A'}</p>
            <p><strong>Serial Number:</strong> {productDetails['Serial Number'] || 'N/A'}</p>
            <p><strong>Category:</strong> {productDetails['Category'] || 'N/A'}</p>
            <p><strong>Branch:</strong> {productDetails['Branch'] || 'N/A'}</p>
            <p><strong>Department:</strong> {productDetails['Department'] || 'N/A'}</p>
            <p><strong>Specific Room:</strong> {productDetails['Specific Room'] || 'N/A'}</p>
          </div>
        ) : (
          <p>No product found for this barcode.</p>
        )
      ) : (
        error && <p style={{ color: 'red' }}>{error}</p>
      )}
    </div>
  );
};

export default BarcodeScanner;
