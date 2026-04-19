'use client';

import ProductCard from '@/components/products/ProductCard';
import type { IProduct } from '@/types';

interface FeaturedProductsProps {
  products: IProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
