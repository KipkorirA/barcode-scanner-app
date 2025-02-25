import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import PropTypes from 'prop-types';

const ProductCard = ({ product }) => (
  <Card className="w-full mt-4 bg-blue-50 border-blue-200">
    <CardHeader className="bg-blue-100">
      <CardTitle className="text-blue-800">Product Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {Object.entries(product)
        .filter(([, value]) => value)
        .map(([key, value]) => (
          <div key={key} className="flex justify-between border-b border-blue-100 pb-2">
            <span className="font-medium text-blue-700">
              {key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}:
            </span>
            <span className="text-right text-blue-600">{value}</span>
          </div>
        ))}
    </CardContent>
  </Card>
);

ProductCard.propTypes = {
  product: PropTypes.shape({}).isRequired,
};

export default ProductCard;