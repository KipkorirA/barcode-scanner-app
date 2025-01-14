import React from 'react';
import { Circles } from 'react-loader-spinner';
import ScannerUI from './ScannerUI';
import ProductCard from './ProductCard';
import ScannerControlButtons from './ScannerControlButtons';
import { Alert, AlertDescription } from '../ui/Alert';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

const BarcodeScanner = () => {
  const {
    barcode,
    productDetails,
    error,
    isLoading,
    isScannerActive,
    scanStatus,
    startScanner,
    resetScanner,
    fetchProductDetails,
  } = useBarcodeScanner();

  // Start scanner automatically when component mounts
  React.useEffect(() => {
    startScanner();
  }, [startScanner]);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Barcode Scanner</h1>
        <ScannerUI
          isScannerActive={isScannerActive}
          scanStatus={scanStatus}
          startScanner={startScanner}
          fetchProductDetails={fetchProductDetails}
        />
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
            <ScannerControlButtons onReset={resetScanner} />
          )}
          {productDetails ? (
            <ProductCard product={productDetails} />
          ) : (
            barcode && (
              <Alert>
                <AlertDescription>No product found for barcode: {barcode}</AlertDescription>
              </Alert>
            )
          )}
        </>
      )}
    </div>
  );
};

export default BarcodeScanner;