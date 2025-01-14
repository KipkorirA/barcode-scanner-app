import { useRef } from 'react';
import { Camera } from 'lucide-react';
import PropTypes from 'prop-types';

const ScannerUI = ({ isScannerActive, scanStatus, startScanner }) => {
  const scannerRef = useRef();

  return isScannerActive ? (
    <div className="relative">
      <video
        ref={scannerRef}
        className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute inset-0 border-2 border-blue-500 opacity-50 pointer-events-none" />
      {scanStatus && <div className="mt-2 text-lg">{scanStatus}</div>}
    </div>
  ) : (
    <button onClick={startScanner} className="w-full flex items-center justify-center gap-2">
      <Camera className="w-4 h-4" />
      Start Scanning
    </button>
  );
};

ScannerUI.propTypes = {
  isScannerActive: PropTypes.bool.isRequired,
  scanStatus: PropTypes.string,
  startScanner: PropTypes.func.isRequired,
};

export default ScannerUI;