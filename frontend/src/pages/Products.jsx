import { useEffect, useState } from "react";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");

        setProducts(response.data.data.products || []);
      } catch (error) {
        console.error(error);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">
        ShopSphere Products
      </h1>

      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-xl shadow p-4"
            >
              <div className="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                {product.images?.[0]?.url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-400">
                    No Image
                  </span>
                )}
              </div>

              <h2 className="font-semibold text-lg">
                {product.name}
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                {product.shortDescription}
              </p>

              {product.variants?.length > 0 && (
                <p className="font-bold mt-3">
                  ₹{product.variants[0].price}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;