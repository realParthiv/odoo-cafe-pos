import React, { useState, useEffect } from "react";
import { menuService } from "../../services/apiService";

const ProductCatalog = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await menuService.getCategories();
        setCategories(response.results || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {};
        if (activeCategory) params.category = activeCategory;
        if (searchTerm) params.search = searchTerm;
        const response = await menuService.getProducts(params);
        // Handle both paginated and direct array responses
        const productsList = Array.isArray(response)
          ? response
          : response.results || response.data || [];
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [activeCategory, searchTerm]);

  const filteredProducts = products;

  if (loading && products.length === 0)
    return <div className="loading-spinner">Loading Menu...</div>;

  return (
    <div className="product-catalog">
      <div className="catalog-header">
        <div className="category-tabs">
          <button
            className={`category-tab ${activeCategory === null ? "active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? "active" : ""}`}
              style={{ "--category-color": category.color || "#3498db" }}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name === "Pastries" ? "Desert" : category.name}
            </button>
          ))}
        </div>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`product-card ${!product.is_active ? "unavailable" : ""}`}
          >
            <div className="product-image">
              <img
                src={product.image_url || product.image}
                alt={product.name}
                className="product-img"
                style={{
                  display:
                    product.image_url || product.image ? "block" : "none",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling)
                    e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="placeholder-image"
                style={{
                  display: product.image_url || product.image ? "none" : "flex",
                }}
              >
                {product.name.charAt(0)}
              </div>
              {!product.is_active && (
                <div className="sold-out-overlay">
                  <span>SOLD OUT</span>
                </div>
              )}
            </div>
            <div className="product-details">
              <h4 className="product-name">{product.name}</h4>
              <p className="product-description">{product.description}</p>
              <div className="product-meta">
                <span
                  className="category-badge"
                  style={{ backgroundColor: product.category_color }}
                >
                  {product.category_name}
                </span>
                <span className="uom-badge">{product.uom}</span>
              </div>
              <div className="product-footer">
                <div className="price-info">
                  <span className="price">${product.price}</span>
                  <span className="tax">Tax: {product.tax_rate}%</span>
                </div>
                <button
                  className="add-btn"
                  onClick={() => product.is_active && onAddToCart(product)}
                  disabled={!product.is_active}
                >
                  {product.is_active ? "+ Add" : "Sold Out"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-products">
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog;
