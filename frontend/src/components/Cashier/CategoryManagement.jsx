import React, { useState, useEffect } from 'react';
import { menuService } from '../../services/apiService';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#ffffff' });
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await menuService.getCategories();
      setCategories(response.results || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const colors = [
    { name: 'white', code: '#ffffff' },
    { name: 'green', code: '#81C784' },
    { name: 'pink', code: '#E57373' },
    { name: 'blue', code: '#4A90E2' },
    { name: 'yellow', code: '#F5D76E' },
    { name: 'purple', code: '#9B59B6' },
  ];

  const handleSelectCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      await menuService.createCategory({
        name: formData.name,
        color: formData.color,
        sequence: categories.length + 1
      });
      setFormData({ name: '', color: '#ffffff' });
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category: " + (error.message || "Unknown error"));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="category-management-container">
      <div className="category-header-actions">
        <button className="btn-new" onClick={() => setShowForm(true)}>+ New</button>
        {selectedCategories.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedCategories.length} Selected</span>
            <button className="action-btn">★ Action</button>
          </div>
        )}
      </div>



      <table className="category-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input 
                type="checkbox" 
                onChange={(e) => setSelectedCategories(e.target.checked ? categories.map(c => c.id) : [])}
                checked={selectedCategories.length === categories.length && categories.length > 0}
              />
            </th>
            <th>Product Category</th>
            <th>Color</th>
            <th className="action-col"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className={selectedCategories.includes(cat.id) ? 'selected' : ''}>
              <td className="checkbox-col">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => handleSelectCategory(cat.id)}
                />
              </td>
              <td className="category-name-cell">
                <span className="drag-handle">::</span>
                {cat.name}
              </td>
              <td>
                <div className="color-display-row">
                  <div className="color-preview" style={{ backgroundColor: cat.color }}></div>
                </div>
              </td>
              <td className="action-col">
                <button className="delete-btn" onClick={() => handleDelete(cat.id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {showForm && (
            <tr className="inline-create-row">
              <td className="checkbox-col"></td>
              <td>
                <div className="inline-input-group">
                  <span className="drag-handle">::</span>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Quick Bites"
                    className="inline-text-input"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory(e)}
                  />
                </div>
              </td>
              <td>
                <div className="inline-color-picker">
                  {colors.map(c => (
                    <div 
                      key={c.code}
                      className={`color-option small ${formData.color === c.code ? 'selected' : ''}`}
                      style={{ backgroundColor: c.code }}
                      onClick={() => setFormData({...formData, color: c.code})}
                    />
                  ))}
                </div>
              </td>
              <td className="action-col">
                <button className="btn-save-inline" onClick={handleCreateCategory}>✓</button>
                <button className="btn-cancel-inline" onClick={() => setShowForm(false)}>✕</button>
              </td>
            </tr>
          )}
          {!showForm && (
            <tr className="empty-row" onClick={() => setShowForm(true)}>
              <td colSpan="4" className="add-line-cell">Add a line</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryManagement;
