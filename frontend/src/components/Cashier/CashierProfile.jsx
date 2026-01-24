import React, { useState, useEffect } from 'react';
import { authService } from '../../services/apiService';

const CashierProfile = () => {
    const [profile, setProfile] = useState(null);
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.getProfile();
                // API response wrapper handling depends on apiService.js return
                const data = response.data || response; 
                setProfile(data);
                setUpiId(data.upi_id || '');
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                setMessage({ type: 'error', text: 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateUpi = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: '', text: '' });
        try {
            await authService.updateUpi({ upi_id: upiId });
            setMessage({ type: 'success', text: 'UPI entry updated successfully' });
        } catch (error) {
            console.error("Failed to update UPI:", error);
            setMessage({ type: 'error', text: error.message || 'Update failed' });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading Profile...</div>;

    return (
        <div className="cashier-profile-container">
            <div className="profile-header">
                <h3>My Profile</h3>
                <p>Manage your account settings and payment information</p>
            </div>

            <div className="profile-card">
                <div className="profile-info-section">
                    <div className="info-row">
                        <label>Full Name</label>
                        <span>{profile?.full_name}</span>
                    </div>
                    <div className="info-row">
                        <label>Role</label>
                        <span className="role-badge">{profile?.role}</span>
                    </div>
                </div>

                <form className="upi-update-form" onSubmit={handleUpdateUpi}>
                    <div className="form-group">
                        <label>UPI ID (for Customer Payments)</label>
                        <input 
                            type="text" 
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. name@upi"
                            className="input-underlined"
                        />
                        <p className="input-hint">This ID will be used to generate QR codes for customers</p>
                    </div>

                    {message.text && (
                        <div className={`message-banner ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn-update-profile" 
                        disabled={updating}
                    >
                        {updating ? 'Updating...' : 'Update UPI ID'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CashierProfile;
