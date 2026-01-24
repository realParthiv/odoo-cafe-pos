import React, { useState } from 'react';
import { PRODUCTS, CATEGORIES } from '../../constants/mockData';
import CategoryManagement from './CategoryManagement';
import ProductCreation from './ProductCreation';

const ProductsList = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'category', 'create'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState(null);

  if (activeTab === 'create') {
    return (
      <div className="products-list-container">
        <div className="products-list-header">
          <div className="header-left">
            <h2 className="clickable-breadcrumb">
              <span onClick={() => setActiveTab('products')}>Products</span>
              <span className="separator"> / </span>
              <span className="current">New</span>
            </h2>
          </div>
        </div>
        <ProductCreation />
      </div>
    );
  }

  if (activeTab === 'category') {
    return (
      <div className="products-list-container">
        <div className="products-list-header">
          <div className="header-left">
            <h2>Categories</h2>
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Products
              </button>
              <button 
                className={`tab ${activeTab === 'category' ? 'active' : ''}`}
                onClick={() => setActiveTab('category')}
              >
                Category
              </button>
            </div>
          </div>
        </div>
        <CategoryManagement />
      </div>
    );
  }

  const filteredProducts = filterCategory
    ? PRODUCTS.filter(p => p.category_id === filterCategory)
    : PRODUCTS;

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }
    
    switch (action) {
      case 'archive':
        console.log('Archiving products:', selectedProducts);
        alert(`Archived ${selectedProducts.length} products`);
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedProducts.length} products?`)) {
          console.log('Deleting products:', selectedProducts);
          alert(`Deleted ${selectedProducts.length} products`);
        }
        break;
      default:
        break;
    }
    setSelectedProducts([]);
  };

  return (
    <div className="products-list-container">
      <div className="products-list-header">
        <div className="header-left">
          <h2>Products</h2>
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            <button 
              className={`tab ${activeTab === 'category' ? 'active' : ''}`}
              onClick={() => setActiveTab('category')}
            >
              Category
            </button>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-new-product" onClick={() => setActiveTab('create')}>
            + New
          </button>
          {selectedProducts.length > 0 && (
            <div className="selection-info">
              <span className="selection-badge">✕ {selectedProducts.length} Selected</span>
              <div className="action-dropdown">
                <button className="action-btn">★ Action</button>
                <div className="dropdown-menu">
                  <button onClick={() => handleBulkAction('archive')}>
                    📦 Archived
                  </button>
                  <button onClick={() => handleBulkAction('delete')}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="category-filter">
        <label>Filter by Category:</label>
        <select
          value={filterCategory || ''}
          onChange={(e) => setFilterCategory(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Product</th>
              <th>Sale Prices</th>
              <th>Tax</th>
              <th>UOM</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr
                key={product.id}
                className={selectedProducts.includes(product.id) ? 'selected' : ''}
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                  />
                </td>
                <td className="product-name-col">
                  <div className="product-name-cell">
                    <div className="product-icon">
                      {product.name.charAt(0)}
                    </div>
                    <span>{product.name}</span>
                  </div>
                </td>
                <td className="price-col">${product.price}</td>
                <td className="tax-col">{product.tax_rate}%</td>
                <td className="uom-col">{product.uom}</td>
                <td className="category-col">
                  <span
                    className="category-badge-table"
                    style={{ backgroundColor: product.category_color }}
                  >
                    {product.category_name}
                  </span>
                  {product.has_variants && (
                    <span className="variant-indicator" title="Has variants">
                      ⚙️
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-products-table">
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
