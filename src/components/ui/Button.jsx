import PropTypes from 'prop-types';

export const Button = ({ children, onClick, className, disabled = false, type = 'button', variant = 'primary', size = 'medium' }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-sm hover:shadow',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow',
    success: 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow'
  };
  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'transform hover:-translate-y-0.5'
      } ${className || ''}`}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default Button;