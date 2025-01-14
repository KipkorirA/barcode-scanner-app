import PropTypes from 'prop-types';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';

const ScannerControlButtons = ({ onReset }) => (
  <Button onClick={onReset} className="w-full flex items-center justify-center gap-2">
    <RefreshCw className="w-4 h-4" />
    Scan Another Barcode
  </Button>
);

ScannerControlButtons.propTypes = {
  onReset: PropTypes.func.isRequired,
};

export default ScannerControlButtons;
