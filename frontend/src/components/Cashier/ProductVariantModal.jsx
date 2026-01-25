import React, { useState } from "react";
import { PRODUCT_VARIANTS } from "../../constants/mockData";

const ProductVariantModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const variants = PRODUCT_VARIANTS[product.id] || [];
  const hasVariants = variants.length > 0;

  const calculatePrice = () => {
    if (!selectedVariant) return Number(product.price || 0);
    return (
      Number(product.price || 0) + Number(selectedVariant.extra_price || 0)
    );
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      alert("Please select a variant");
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: calculatePrice(),
      quantity: quantity,
      tax_rate: Number(product.tax_rate || 0),
      uom: selectedVariant ? selectedVariant.unit : product.uom,
      variant: selectedVariant
        ? `${selectedVariant.attribute}: ${selectedVariant.value}`
        : null,
      variant_id: selectedVariant ? selectedVariant.id : null,
      image: product.image_url || product.image,
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
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="product-details-container">
            {/* Left Column: Image & Basic Info */}
            <div className="product-visuals">
              {product.image_url || product.image ? (
                <img
                  src={product.image_url || product.image}
                  alt={product.name}
                  className="product-modal-image"
                />
              ) : (
                <div className="product-modal-placeholder">
                  {product.name.charAt(0)}
                </div>
              )}
              <div className="base-price-tag">
                <span>Base Price</span>
                <span className="price">
                  ${Number(product.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="product-controls">
              <p className="product-description">
                {product.description || "No description available."}
              </p>

              {hasVariants ? (
                <div className="variants-section">
                  <h3 className="section-title">Select Variant</h3>
                  <div className="variants-grid">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        className={`variant-option-btn ${selectedVariant?.id === variant.id ? "selected" : ""}`}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        <span className="variant-name">{variant.value}</span>
                        <span className="variant-extra">
                          +
                          {variant.extra_price > 0
                            ? `$${variant.extra_price}`
                            : "Free"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-variants-message">
                  <span>ℹ️ Standard Item</span>
                  <p>This product has no customizable options.</p>
                </div>
              )}

              <div className="quantity-section">
                <label>Quantity</label>
                <div className="quantity-control-premium">
                  <button
                    className="qty-btn-premium"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="quantity-input-premium"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    min="1"
                  />
                  <button
                    className="qty-btn-premium"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="total-section-premium">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>${(calculatePrice() * quantity).toFixed(2)}</span>
                </div>
                <div className="total-row tax">
                  <span>Tax ({product.tax_rate}%)</span>
                  <span>
                    $
                    {(
                      (calculatePrice() * quantity * product.tax_rate) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="total-row grand">
                  <span>Total</span>
                  <span className="grand-total-amount">
                    $
                    {(
                      calculatePrice() *
                      quantity *
                      (1 + product.tax_rate / 100)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
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
