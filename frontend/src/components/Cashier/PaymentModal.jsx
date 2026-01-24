import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/apiService';

const PaymentModal = ({ isOpen, onClose, orderTotal, onConfirmPayment }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [splitPayments, setSplitPayments] = useState([]);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'qr', 'success'
  const [isInvoice, setIsInvoice] = useState(false);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await paymentService.getPaymentMethods();
        setPaymentMethods(data);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };
    if (isOpen) {
      fetchMethods();
    } else {
      setPaymentStatus('idle');
      setSplitPayments([]);
      setAmountPaid('');
      setSelectedMethod(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - orderTotal);
  };

  const calculateSplitTotal = () => {
    return splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const remainingAmount = Math.max(0, orderTotal - calculateSplitTotal());

  const handleAddSplitPayment = (methodId, amount) => {
    const method = paymentMethods.find(m => m.id === methodId);
    setSplitPayments([
      ...splitPayments,
      {
        method_id: methodId,
        method_name: method?.name,
        amount: parseFloat(amount),
      },
    ]);
  };

  const handleRemoveSplitPayment = (index) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const totalPaid = isSplitMode ? calculateSplitTotal() : parseFloat(amountPaid);
    if (totalPaid >= orderTotal) {
      setPaymentStatus('success');
    } else {
      alert('Total paid amount must equal or exceed order total');
    }
  };

  const handleFinalize = () => {
    onConfirmPayment({
      type: isSplitMode ? 'split' : 'single',
      payments: isSplitMode ? splitPayments : [{ method_id: selectedMethod, amount: parseFloat(amountPaid) }],
      total: orderTotal,
    });
    onClose();
  };

  const handleUPIClick = () => {
    setSelectedMethod(3); // Assuming 3 is UPI based on mock
    setPaymentStatus('qr');
  };

  // Payment Success Screen
  if (paymentStatus === 'success') {
    return (
      <div className="modal-overlay success-overlay" onClick={handleFinalize}>
        <div className="success-screen" onClick={(e) => e.stopPropagation()}>
          <div className="success-header">
            <div className="logo-placeholder">Logo</div>
          </div>
          <div className="success-body">
            <h1>Amount Paid ${orderTotal.toFixed(2)}</h1>
            <div className="success-actions">
              <button className="btn-email-receipt">Email Receipt</button>
              <button className="btn-continue" onClick={handleFinalize}>Continue</button>
            </div>
          </div>
          <p className="click-hint">Click anywhere to skip</p>
        </div>
      </div>
    );
  }

  // UPI QR Modal
  if (paymentStatus === 'qr') {
    return (
      <div className="modal-overlay">
        <div className="qr-modal">
          <div className="qr-header">
            <h3>UPI QR</h3>
            <button className="close-btn" onClick={() => setPaymentStatus('idle')}>✕</button>
          </div>
          <div className="qr-body">
            <div className="qr-code-placeholder">
              <div className="qr-frame">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=POS-CAFE-PAYMENT" alt="QR Code" />
                <div className="qr-center-text">SCAN ME</div>
              </div>
            </div>
            <div className="qr-amount">Amount ${orderTotal.toFixed(2)}</div>
            <div className="qr-actions">
              <button className="btn-confirm-qr" onClick={() => {
                if (isSplitMode) {
                  handleAddSplitPayment(3, remainingAmount);
                  setPaymentStatus('idle');
                } else {
                  setAmountPaid(orderTotal.toString());
                  handleConfirm();
                }
              }}>Confirmed</button>
              <button className="btn-cancel-qr" onClick={() => setPaymentStatus('idle')}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="payment-modal-advanced">
        <div className="payment-sidebar">
          <div className="payment-header">
            <h2>Payment</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          
          <div className="payment-total-display">
            <div className="total-label">Total to Pay</div>
            <div className="total-value">${orderTotal.toFixed(2)}</div>
          </div>

          <div className="active-payments">
            {isSplitMode ? (
              splitPayments.map((p, i) => (
                <div key={i} className="payment-row">
                  <span className="method-name">{p.method_name}</span>
                  <span className="method-amount">${p.amount.toFixed(2)}</span>
                  <button className="remove-row" onClick={() => handleRemoveSplitPayment(i)}>✕</button>
                </div>
              ))
            ) : (
              selectedMethod && amountPaid && (
                <div className="payment-row">
                  <span className="method-name">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}</span>
                  <span className="method-amount">${parseFloat(amountPaid).toFixed(2)}</span>
                </div>
              )
            )}
          </div>

          <div className="payment-inputs">
            <div className="input-group">
              <label>Cash</label>
              <input 
                type="number" 
                placeholder="$0.00"
                value={selectedMethod === 1 ? amountPaid : ''}
                onChange={(e) => {
                  setSelectedMethod(1);
                  setAmountPaid(e.target.value);
                  setIsSplitMode(false);
                }}
              />
            </div>
            <div className="input-group">
              <label>Digital (Bank, Card)</label>
              <input 
                type="number" 
                placeholder="$0.00"
                value={selectedMethod === 2 ? amountPaid : ''}
                onChange={(e) => {
                  setSelectedMethod(2);
                  setAmountPaid(e.target.value);
                  setIsSplitMode(false);
                }}
              />
            </div>
            <button 
              className={`upi-btn-select ${selectedMethod === 3 ? 'active' : ''}`}
              onClick={handleUPIClick}
            >
              UPI
            </button>
          </div>

          <div className="invoice-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={isInvoice} 
                onChange={(e) => setIsInvoice(e.target.checked)}
              />
              Is Invoice
            </label>
          </div>

          <button className="btn-validate" onClick={handleConfirm}>
            Validate
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
