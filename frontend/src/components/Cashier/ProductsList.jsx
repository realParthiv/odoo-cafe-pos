import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/apiService';
import CategoryManagement from './CategoryManagement';
import ProductCreation from './ProductCreation';

const ProductsList = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'category', 'create'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filterCategory, setFilterCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          menuService.getCategories(),
          menuService.getProducts(filterCategory ? { category: filterCategory } : {})
        ]);
        setCategories(catsRes.results || []);
        setProducts(prodsRes.results || []);
      } catch (error) {
        console.error("Failed to fetch product data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filterCategory]);

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

  const filteredProducts = products;

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

  const handleToggleAvailability = async (productId, currentStatus) => {
    try {
      await menuService.toggleAvailability(productId, { is_active: !currentStatus });
      // Refresh list
      const prodsRes = await menuService.getProducts(filterCategory ? { category: filterCategory } : {});
      setProducts(prodsRes.results || []);
    } catch (error) {
      console.error("Failed to toggle availability:", error);
      alert("Failed to update availability");
    }
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
          {categories.map(cat => (
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
              <th>Availability</th>
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
                    <div className="product-icon-list">
                      {product.image_url || product.image ? (
                        <img src={product.image_url || product.image} alt="" className="product-list-thumb" />
                      ) : (
                        <span>{product.name.charAt(0)}</span>
                      )}
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
                <td className="availability-col">
                  <div 
                    className={`status-toggle ${product.is_active ? 'active' : ''}`}
                    onClick={() => handleToggleAvailability(product.id, product.is_active)}
                  >
                    <div className="toggle-handle"></div>
                  </div>
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
