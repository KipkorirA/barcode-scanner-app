import { Camera } from 'lucide-react';
import PropTypes from 'prop-types';

const ScannerUI = ({ isScannerActive, scanStatus, startScanner }) => {
  return (
    <div className="w-full min-h-[300px] flex items-center justify-center bg-gray-50 rounded-xl p-6">
      <div className="w-full max-w-sm mx-auto">
        {isScannerActive ? (
          <div className="relative">
            <div 
              className="absolute inset-0 border-4 border-blue-500/50 rounded-lg animate-pulse opacity-75 pointer-events-none" 
              role="status"
              aria-label="Scanner active"
            />
            {scanStatus && (
              <div 
                className="mt-4 text-lg font-semibold text-center text-gray-800 bg-white/90 py-2 px-4 rounded-md shadow-sm"
                role="status"
                aria-live="polite"
              >
                {scanStatus}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={startScanner}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Start barcode scanner"
            type="button"
          >
            <Camera className="w-6 h-6" aria-hidden="true" />
            <span>Start Scanning</span>
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