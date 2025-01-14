import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import PropTypes from 'prop-types';

const ProductCard = ({ product }) => (
  <Card className="w-full mt-4">
    <CardHeader>
      <CardTitle>Product Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {Object.entries(product).map(([key, value]) =>
        value ? (
          <div key={key} className="flex justify-between border-b pb-2">
            <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
            <span className="text-right">{value}</span>
          </div>
        ) : null
      )}
    </CardContent>
  </Card>
);

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
};

export default ProductCard;
