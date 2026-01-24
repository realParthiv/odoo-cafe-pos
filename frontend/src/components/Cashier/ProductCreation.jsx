import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/apiService';
import CategoryManagement from './CategoryManagement';

const ProductCreation = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    tax: 5,
    uom: 'Unit',
    image: null,
    imagePreview: null
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await menuService.getCategories();
        setCategories(response.results || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const [variants, setVariants] = useState([
    { id: 1, attribute: 'Pack', value: '6', unit: 'Unit', extraPrice: '20' },
    { id: 2, attribute: 'Pack', value: '12', unit: 'Unit', extraPrice: '0' }
  ]);

  const handleInputChange = (field, value) => {
    setProductData({ ...productData, [field]: value });
  };

  const addVariantRow = () => {
    const newId = variants.length > 0 ? Math.max(...variants.map(v => v.id)) + 1 : 1;
    setVariants([...variants, { id: newId, attribute: '', value: '', unit: 'Unit', extraPrice: '0' }]);
  };

  const updateVariant = (id, field, value) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleSave = async () => {
    if (!productData.name || !productData.category_id || !productData.price) {
      alert("Please fill in all required fields (Name, Category, Price)");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category: parseInt(productData.category_id),
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price).toFixed(2),
        tax_rate: parseInt(productData.tax),
        uom: productData.uom,
        has_variants: variants.length > 0,
        image: productData.imagePreview, // This is the Base64 string from the reader
        variants: variants.map(v => ({
          attribute: v.attribute,
          value: v.value,
          unit: v.unit || productData.uom,
          extra_price: parseFloat(v.extraPrice || 0).toFixed(2),
          is_active: true
        }))
      };

      console.log('JSON Payload:', payload);
      
      await menuService.createProduct(payload);
      alert("Product created successfully!");
      // Reset form or navigate
      setProductData({
        name: '',
        category_id: '',
        description: '',
        price: '',
        tax: 5,
        uom: 'Unit',
        image: null,
        imagePreview: null
      });
      setVariants([]);
      setActiveTab('general');
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-creation-container">
      <div className="admin-header">
        <h2>Product Configuration</h2>
        <div className="header-actions">
          <button className="btn-save" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button className="btn-discard" onClick={() => window.location.reload()}>Discard</button>
        </div>
      </div>

      <div className="product-form-card">
        <div className="product-title-section">
          <label>Product Name</label>
          <input 
            type="text" 
            placeholder="e.g. Eric Smith" 
            value={productData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="input-large"
          />
        </div>

        <div className="form-tabs">
          <button 
            className={`form-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General Info
          </button>
          <button 
            className={`form-tab ${activeTab === 'variant' ? 'active' : ''}`}
            onClick={() => setActiveTab('variant')}
          >
            Variant
          </button>
          <button 
            className={`form-tab ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => setActiveTab('category')}
          >
            Category
          </button>
        </div>

        <div className="form-content">
          {activeTab === 'general' && (
            <div className="general-info-grid">
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={productData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                >
                  <option value="">Select Category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Product Description</label>
                <textarea 
                  placeholder="e.g. Burger with cheese"
                  value={productData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="form-group image-upload-group">
                <label>Product Image</label>
                <div className="image-preview-container">
                  {productData.imagePreview ? (
                    <div className="preview-wrapper">
                      <img src={productData.imagePreview} alt="Preview" className="image-preview" />
                      <button 
                        className="btn-change-image"
                        onClick={() => document.getElementById('product-image-input').click()}
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="upload-placeholder"
                      onClick={() => document.getElementById('product-image-input').click()}
                    >
                      <span className="upload-icon">📷</span>
                      <span>Click to upload image</span>
                    </div>
                  )}
                  <input 
                    id="product-image-input"
                    type="file" 
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProductData({
                            ...productData,
                            image: file,
                            imagePreview: reader.result
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-group price-group">
                <label>Sale Price</label>
                <div className="price-input-wrapper">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={productData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                  />
                  <select 
                    value={productData.uom}
                    onChange={(e) => handleInputChange('uom', e.target.value)}
                    className="uom-select"
                  >
                    <option value="Unit">Unit</option>
                    <option value="K.G">K.G</option>
                    <option value="Liter">Liter</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Customer Tax</label>
                <select 
                  value={productData.tax}
                  onChange={(e) => handleInputChange('tax', parseInt(e.target.value))}
                >
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'variant' && (
            <div className="variant-management">
              <table className="variant-table">
                <thead>
                  <tr>
                    <th>Attributes</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Extra Prices</th>
                    <th className="action-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(variant => (
                    <tr key={variant.id}>
                      <td>
                        <input 
                          type="text" 
                          placeholder="e.g. Pack"
                          value={variant.attribute}
                          onChange={(e) => updateVariant(variant.id, 'attribute', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          placeholder="Value"
                          value={variant.value}
                          onChange={(e) => updateVariant(variant.id, 'value', e.target.value)}
                        />
                      </td>
                      <td>
                        <select 
                          value={variant.unit}
                          onChange={(e) => updateVariant(variant.id, 'unit', e.target.value)}
                        >
                          <option value="Unit">Unit</option>
                          <option value="K.G">K.G</option>
                          <option value="Liter">Liter</option>
                        </select>
                      </td>
                      <td>
                        <div className="price-with-symbol">
                          <span>$</span>
                          <input 
                            type="number" 
                            value={variant.extraPrice}
                            onChange={(e) => updateVariant(variant.id, 'extraPrice', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="action-col">
                        <button 
                          className="btn-trash"
                          onClick={() => removeVariant(variant.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="add-row">
                    <td colSpan="5">
                      <button className="btn-add-line" onClick={addVariantRow}>
                        + Add a line
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'category' && (
            <CategoryManagement />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCreation;
