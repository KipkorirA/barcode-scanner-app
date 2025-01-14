import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export const useBarcodeScanner = () => {
    const [barcode, setBarcode] = useState('');
    const [productDetails, setProductDetails] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scanStatus, setScanStatus] = useState('');
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
    const API_KEY = import.meta.env.VITE_APP_API_KEY;
    const BASE_ID = import.meta.env.VITE_APP_BASE_ID;
    const TABLE_NAME = import.meta.env.VITE_APP_TABLE_NAME;

    const fetchProductDetails = useCallback(async (barcodeValue) => {
        setIsLoading(true);
        setError(null);

        try {
            const url = `${API_BASE_URL}/${BASE_ID}/${TABLE_NAME}?filterByFormula=({BARCODE}="${barcodeValue}")`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${API_KEY}` },
            });
            const data = await response.json();
            setProductDetails(data.records.length > 0 ? data.records[0].fields : null);
        } catch (error) {
            setError('Failed to fetch product details.');
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL, API_KEY, BASE_ID, TABLE_NAME]);

    const startScanner = () => {
        if (barcode || isScannerActive) return;

        setIsScannerActive(true);
        setError(null);
        setScanStatus('Initializing camera...');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Camera not supported on this device or browser.');
            setIsScannerActive(false);
            return;
        }

        // Initialize the scanner with the Html5QrcodeScanner
        scannerInstanceRef.current = new Html5QrcodeScanner(
            scannerRef.current,
            {
                fps: 10, // Frames per second for scanning
                qrbox: 250, // Set the size of the scanning box (adjust based on preference)
                supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_BARCODE] // Ensures only barcode scanning
            },
            false
        );

        // Start scanning for barcodes
        scannerInstanceRef.current.render(onScanSuccess, onScanError);
    };

    const onScanSuccess = (decodedText) => {
        if (!barcode) {
            setBarcode(decodedText); // Set barcode after successful scan
            setIsScannerActive(false); // Stop scanner after successful scan
            setScanStatus('Scan finished.');
            scannerInstanceRef.current.clear(); // Clear the scanner instance
        }
    };

    const onScanError = (error) => {
        console.error('Scan error:', error); // Handle scanning errors
    };

    const resetScanner = useCallback(() => {
        setBarcode('');
        setProductDetails(null);
        setError(null);
        setScanStatus('');
        setIsScannerActive(false);

        if (scannerInstanceRef.current) {
            scannerInstanceRef.current.clear(); // Clear the scanner instance when resetting
        }
    }, []);

    useEffect(() => {
        return resetScanner;
    }, [resetScanner]);

    useEffect(() => {
        if (barcode) {
            fetchProductDetails(barcode); // Fetch product details based on scanned barcode
        }
    }, [barcode, fetchProductDetails]);

    return {
        barcode,
        productDetails,
        error,
        isLoading,
        isScannerActive,
        scanStatus,
        startScanner,
        resetScanner,
    };
};
