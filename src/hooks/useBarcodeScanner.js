import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

export const useBarcodeScanner = () => {
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
        } catch (err) {
            setError('Failed to fetch product details.');
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL, API_KEY, BASE_ID, TABLE_NAME]);

    const startScanner = () => {
        if (barcode || isScannerActive || isScanningRef.current) return;

        setIsScannerActive(true);
        setError(null);
        setScanStatus('Initializing camera...');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Camera not supported on this device or browser.');
            setIsScannerActive(false);
            return;
        }

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' } })
            .then((stream) => {
                if (scannerRef.current) {
                    videoStreamRef.current = stream;
                    scannerRef.current.srcObject = stream;

                    scannerRef.current.onloadedmetadata = () => {
                        console.log('Camera metadata loaded, starting scanning...');
                        setScanStatus('Scanning...');
                        isScanningRef.current = true;
                        scanFrame();
                    };
                }
            })
            .catch((error) => {
                console.error('Camera access denied:', error.message);
                handleCameraError(error);
            });

        const scanFrame = () => {
            if (!scannerRef.current || !isScannerActive || barcode) {
                setScanStatus('Scan finished.');
                cancelAnimationFrame(requestIdRef.current);
                return;
            }

            codeReader.current
                .decodeFromVideoElement(scannerRef.current)
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
                .catch((error) => {
                    if (error && !(error instanceof NotFoundException)) {
                        console.error('Decoding error:', error);
                    }
                });

            if (isScannerActive && !barcode) {
                requestIdRef.current = requestAnimationFrame(scanFrame);
            }
        };
    };

    const handleCameraError = (error) => {
        if (error.name === 'NotAllowedError') {
            setError('Camera access was denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
            setError('No camera found on this device.');
        } else if (error.name === 'NotReadableError') {
            setError('Camera is already in use by another application.');
        } else {
            setError('An unexpected error occurred while accessing the camera.');
        }
        setIsScannerActive(false);
        setScanStatus('');
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
            resetScanner();
        };
    }, []);

    useEffect(() => {
        if (barcode) {
            fetchProductDetails(barcode);
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
