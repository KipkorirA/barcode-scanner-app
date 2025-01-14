import { useRef } from 'react';
import { Camera } from 'lucide-react';
import PropTypes from 'prop-types';

const ScannerUI = ({ isScannerActive, scanStatus, startScanner }) => {
  const scannerRef = useRef(null);

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-4">
        {isScannerActive ? (
          <div className="relative">
            <video
              ref={scannerRef}
              className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg"
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-0 border-2 border-blue-500 opacity-50 pointer-events-none" />
            {scanStatus && (
              <div className="mt-2 text-lg font-medium text-center text-gray-700">{scanStatus}</div>
            )}
          </div>
        ) : (
          <button
            onClick={startScanner}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
            aria-label="Start barcode scanner"
          >
            <Camera className="w-5 h-5" />
            Start Scanning
          </button>
        )}
      </div>
    </div>
  );
};

ScannerUI.propTypes = {
  isScannerActive: PropTypes.bool.isRequired,
  scanStatus: PropTypes.string,
  startScanner: PropTypes.func.isRequired,
};

export default ScannerUI;