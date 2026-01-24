import React, { useState } from 'react';
import { PRODUCT_VARIANTS } from '../../constants/mockData';

const ProductVariantModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const variants = PRODUCT_VARIANTS[product.id] || [];
  const hasVariants = variants.length > 0;

  const calculatePrice = () => {
    if (!selectedVariant) return product.price;
    return product.price + selectedVariant.extra_price;
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      alert('Please select a variant');
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: calculatePrice(),
      quantity: quantity,
      tax_rate: product.tax_rate,
      uom: selectedVariant ? selectedVariant.unit : product.uom,
      variant: selectedVariant ? `${selectedVariant.attribute}: ${selectedVariant.value}` : null,
    };

    onAddToCart(cartItem);
    onClose();
    setSelectedVariant(null);
    setQuantity(1);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="variant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="product-info-section">
            <p className="product-description">{product.description}</p>
            <div className="base-price">
              <span>Base Price:</span>
              <span className="price">${product.price}</span>
            </div>
          </div>

          {hasVariants ? (
            <>
              <h3 className="section-title">Select Variant</h3>
              <div className="variants-table">
                <table>
                  <thead>
                    <tr>
                      <th>Attributes</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>Extra Prices</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr
                        key={variant.id}
                        className={selectedVariant?.id === variant.id ? 'selected' : ''}
                      >
                        <td>{variant.attribute}</td>
                        <td>{variant.value}</td>
                        <td>
                          <span className="unit-badge">{variant.unit}</span>
                        </td>
                        <td>${variant.extra_price}</td>
                        <td>
                          <button
                            className={`select-variant-btn ${selectedVariant?.id === variant.id ? 'selected' : ''}`}
                            onClick={() => setSelectedVariant(variant)}
                          >
                            {selectedVariant?.id === variant.id ? '✓ Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedVariant && (
                <div className="selected-variant-info">
                  <div className="info-row">
                    <span>Selected:</span>
                    <span className="highlight">
                      {selectedVariant.attribute} - {selectedVariant.value} ({selectedVariant.unit})
                    </span>
                  </div>
                  <div className="info-row">
                    <span>Total Price:</span>
                    <span className="price-highlight">${calculatePrice()}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-variants">
              <p>This product has no variants. Standard pricing applies.</p>
            </div>
          )}

          <div className="quantity-section">
            <label>Quantity:</label>
            <div className="quantity-control-large">
              <button
                className="qty-btn-large"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button
                className="qty-btn-large"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="total-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span className="total-amount">${(calculatePrice() * quantity).toFixed(2)}</span>
            </div>
            <div className="tax-info">
              <span>Tax ({product.tax_rate}%):</span>
              <span>${((calculatePrice() * quantity * product.tax_rate) / 100).toFixed(2)}</span>
            </div>
            <div className="grand-total">
              <span>Total:</span>
              <span>${((calculatePrice() * quantity) * (1 + product.tax_rate / 100)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-add-to-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductVariantModal;
