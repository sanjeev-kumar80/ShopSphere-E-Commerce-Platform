import ProductCard from "../ProductCard";

/**
 * ProductRecommendationCard
 * Reuses the native ShopSphere ProductCard component to render verified
 * catalog items recommended by the AI Shopping Assistant.
 */
export default function ProductRecommendationCard({ product }) {
  if (!product || !product._id) return null;

  return (
    <div className="w-full max-w-[280px] sm:max-w-[260px] flex-shrink-0">
      <ProductCard product={product} />
    </div>
  );
}
