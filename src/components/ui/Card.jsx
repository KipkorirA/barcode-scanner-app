import PropTypes from 'prop-types';

export const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg p-4 ${className || ''}`}>
    {children}
  </div>
);

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const CardHeader = ({ children, className }) => (
  <div className={`border-b pb-2 mb-4 ${className || ''}`}>
    {children}
  </div>
);

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const CardTitle = ({ children, className }) => (
  <h2 className={`text-lg font-bold ${className || ''}`}>{children}</h2>
);

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const CardContent = ({ children, className }) => (
  <div className={`space-y-2 ${className || ''}`}>{children}</div>
);

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default { Card, CardHeader, CardTitle, CardContent };
