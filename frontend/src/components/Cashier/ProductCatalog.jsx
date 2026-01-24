import React, { useState } from 'react';
import { PRODUCTS, CATEGORIES } from '../../constants/mockData';

const ProductCatalog = ({ onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter based on search and category
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory ? product.category_id === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="product-catalog">
      <div className="catalog-header-main">
        <div className="category-tabs-main">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`category-tab-btn ${activeCategory === category.id ? 'active' : ''}`}
              style={{
                '--cat-color': category.id === 4 ? '#9B59B6' : // Quick Bites (Purple)
                               category.id === 2 ? '#F5D76E' : // Drinks (Yellow)
                               category.id === 3 ? '#2ECC71' : // Desert (Green)
                               '#4A90E2' // Others
              }}
              onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
            >
              {category.name === 'Pastries' ? 'Desert' : category.name}
            </button>
          ))}
        </div>
        <div className="search-container-main">
          <input
            type="text"
            className="search-input-main"
            placeholder="Search product......"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              <img
                src={product.image_url}
                alt={product.name}
                className="product-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="placeholder-image" style={{ display: 'none' }}>
                {product.name.charAt(0)}
              </div>
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
                  onClick={() => onAddToCart(product)}
                >
                  + Add
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
