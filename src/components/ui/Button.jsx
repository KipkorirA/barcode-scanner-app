import PropTypes from 'prop-types';

export const Button = ({ children, onClick, className, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${className || ''}`}
  >
    {children}
  </button>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Button;
