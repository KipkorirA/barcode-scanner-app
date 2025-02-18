import PropTypes from 'prop-types';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';

const ScannerControlButtons = ({ onReset }) => (
  <Button 
    onClick={onReset} 
    className="w-full flex items-center justify-center gap-2 transition-colors hover:bg-opacity-90"
    aria-label="Reset scanner to scan another barcode"
    type="button"
  >
    <RefreshCw className="w-4 h-4 animate-spin-hover" aria-hidden="true" />
    <span>Scan Another Barcode</span>
  </Button>
);

ScannerControlButtons.propTypes = {
  onReset: PropTypes.func.isRequired,
};

export default ScannerControlButtons;