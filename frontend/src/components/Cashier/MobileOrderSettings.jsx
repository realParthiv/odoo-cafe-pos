import React, { useState, useEffect } from "react";
import { settingsService } from "../../services/apiService";

const MobileOrderSettings = () => {
  const [selfOrdering, setSelfOrdering] = useState(false);
  const [orderType, setOrderType] = useState("online"); // 'online' or 'qr'
  const [bgColor, setBgColor] = useState("#81C784");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getMobileOrderSettings();
        if (settings) {
          setSelfOrdering(settings.self_ordering || false);
          setOrderType(settings.order_type || "online");
          setBgColor(settings.bg_color || "#81C784");
          setUploadedImages(settings.images || []);
        }
      } catch (error) {
        console.error("Failed to fetch mobile order settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateMobileOrderSettings({
        self_ordering: selfOrdering,
        order_type: orderType,
        bg_color: bgColor,
        images: uploadedImages,
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages([...uploadedImages, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const colors = [
    { name: "white", code: "#ffffff" },
    { name: "green", code: "#81C784" },
    { name: "pink", code: "#E57373" },
    { name: "blue", code: "#4A90E2" },
    { name: "yellow", code: "#F5D76E" },
    { name: "purple", code: "#9B59B6" },
  ];

  if (loading)
    return <div className="loading-spinner">Loading Settings...</div>;

  return (
    <div className="mobile-order-settings">
      <div className="settings-section">
        <div className="flex justify-between items-center mb-4">
          <h3>Mobile Order</h3>
          <button
            className="btn-save bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <input
              type="checkbox"
              id="selfOrdering"
              checked={selfOrdering}
              onChange={(e) => setSelfOrdering(e.target.checked)}
            />
            <label htmlFor="selfOrdering">Self Ordering</label>
          </div>
          <p className="setting-description">
            If enabled, then and only visible all the setting below
          </p>
        </div>

        {selfOrdering && (
          <div className="sub-settings-container animation-fade-in">
            <div className="setting-row">
              <div className="dropdown-container">
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="settings-select"
                >
                  <option value="online">Online ordering</option>
                  <option value="qr">QR Menu</option>
                </select>
                <div className="dropdown-hint">
                  {orderType === "online"
                    ? "Online allow customer order"
                    : "QR menu only show a digital menu, on ordering here"}
                </div>
              </div>

              <div className="background-config">
                <label>Background</label>
                <div className="config-controls">
                  <div className="color-picker-mini">
                    <div
                      className="current-color"
                      style={{ backgroundColor: bgColor }}
                    ></div>
                    <div className="color-options">
                      {colors.map((c) => (
                        <div
                          key={c.code}
                          className="mini-color-option"
                          style={{
                            backgroundColor: c.code,
                            border:
                              bgColor === c.code ? "2px solid #333" : "none",
                          }}
                          onClick={() => setBgColor(c.code)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="image-upload-zone">
                    <label className="upload-btn">
                      <span>🖼️ Image upload</span>
                      <input
                        type="file"
                        hidden
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </label>
                    <span className="upload-hint">Multiple image</span>
                  </div>
                </div>
              </div>
            </div>

            {orderType === "online" && (
              <div className="online-ordering-details animation-slide-up">
                <div className="link-group">
                  <span className="link-action">Preview Webpage --&gt;</span>
                  <p className="link-hint">
                    Create a webpage use database URL with append token post URL
                    e.g abcd.com/s/asdfghjk l
                  </p>
                  <div className="link-structure">
                    <span>Domain</span>
                    <span>Self</span>
                    <span>Unique token auto create linked with table</span>
                  </div>
                </div>

                <div className="download-group">
                  <span className="link-action">Download QR code --&gt;</span>
                </div>

                <div className="payment-method-config">
                  <label>Payment Method</label>
                  <div className="checkbox-locked">
                    <input type="checkbox" checked readOnly disabled />
                    <span>Pay at counter</span>
                  </div>
                  <p className="lock-hint">
                    As we have only option Enable it by default and read only
                  </p>
                </div>
              </div>
            )}

            {orderType === "qr" && (
              <div className="qr-menu-details animation-slide-up">
                <p className="type-notice">
                  QR Menu: It's only digital menu not able to order
                </p>
                <div className="link-group">
                  <span className="link-action">Preview Webpage --&gt;</span>
                </div>
                <div className="download-group">
                  <span className="link-action">Download QR code --&gt;</span>
                </div>
                <div className="image-preview-grid">
                  {uploadedImages.map((src, i) => (
                    <div key={i} className="preview-card">
                      <img src={src} alt={`Upload ${i}`} />
                      <button
                        className="remove-img-btn"
                        onClick={() =>
                          setUploadedImages(
                            uploadedImages.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        ×
                      </button>
                      <span>Image {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selfOrdering && (
          <div className="action-footer">
            <button className="btn-download-qr">Download QR code --&gt;</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileOrderSettings;
