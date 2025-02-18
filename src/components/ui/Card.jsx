import PropTypes from 'prop-types';

const Card = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-white shadow-md',
    outline: 'bg-white border border-gray-200',
    ghost: 'hover:bg-gray-100'
  };

  return (
    <div className={`rounded-lg p-4 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'outline', 'ghost'])
};

const CardHeader = ({ children, className = '', align = 'left' }) => (
  <div className={`border-b pb-2 mb-4 ${align === 'center' ? 'text-center' : ''} ${className}`}>
    {children}
  </div>
);

CardHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  align: PropTypes.oneOf(['left', 'center'])
};

const CardTitle = ({ children, className = '', as: Component = 'h2' }) => (
  <Component className={`text-lg font-bold ${className}`}>{children}</Component>
);

CardTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  as: PropTypes.elementType
};

const CardContent = ({ children, className = '', padding = 'default' }) => {
  const paddingVariants = {
    default: 'space-y-2',
    none: '',
    large: 'space-y-4'
  };

  return (
    <div className={`${paddingVariants[padding]} ${className}`}>{children}</div>
  );
};

CardContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  padding: PropTypes.oneOf(['default', 'none', 'large'])
};

export { Card, CardHeader, CardTitle, CardContent };