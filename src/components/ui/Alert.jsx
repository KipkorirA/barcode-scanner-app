import PropTypes from 'prop-types';

export const Alert = ({ children, variant = 'default', className }) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border-gray-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    destructive: 'bg-red-100 text-red-800 border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  return (
    <div
      className={`border-l-4 p-4 rounded-md ${variantClasses[variant]} ${
        className || ''
      }`}
    >
      {children}
    </div>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'success', 'destructive', 'warning']),
  className: PropTypes.string,
};

export const AlertDescription = ({ children, className }) => (
  <div className={`text-sm ${className || ''}`}>{children}</div>
);

AlertDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default { Alert, AlertDescription };
