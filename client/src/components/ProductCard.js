import { Link } from "react-router-dom";
import { BookmarkIcon } from "./Icons";

export default function ProductCard({ product }) {
  const formattedPrice = new Intl.NumberFormat('ko-KR').format(product.price);

  return (
    <div>
      <Link to={`/product/${product._id}`} className="block group">
        <div className="aspect-square overflow-hidden bg-gray-100 rounded-lg mb-3 border border-gray-200/80">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={product.image}
            alt={product.name}
          />
        </div>
      </Link>
      
      <div className="px-1 space-y-1">
        <p className="text-sm font-bold truncate">
            {product.brand || 'No Brand'}
        </p>

        <p className="text-sm text-gray-700 line-clamp-2 leading-tight">
            {product.name}
        </p>
        
        <p className="text-base font-bold text-gray-900 pt-1">
            {formattedPrice}원
        </p>

        <p className="text-sm text-gray-500">
            즉시 구매가
        </p>
        
        <div className="flex items-center text-gray-500 pt-1">
            <BookmarkIcon />
            <span className="text-xs ml-1 font-medium">{product.numReviews || 0}</span>
        </div>
      </div>
    </div>
  );
}