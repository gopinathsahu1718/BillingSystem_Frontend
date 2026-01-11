import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Cart.css';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = 'http://13.232.200.172/api';

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({
    customerName: false,
    mobileNumber: false,
    address: false
  });
  const [summary, setSummary] = useState({
    itemCount: 0,
    taxable: 0,
    discount: 0,
    cgst: 0,
    sgst: 0,
    total: 0
  });

  // Fetch cart items from API
  const fetchCart = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const cartData = response.data.data || [];
        
        // Transform API cart data to match component structure
        const transformedCart = cartData.map(item => {
          // Use effectivePrice if variant exists, otherwise use product price
          const price = item.effectivePrice 
            ? parseFloat(item.effectivePrice) 
            : parseFloat(item.product?.price || 0);
          
          const gstRate = parseFloat(item.product?.gstRate || 0);
          const quantity = parseInt(item.quantity || 1);
          const discount = parseFloat(item.discount || 0);
          
          // Calculate line total
          const lineTotal = price * quantity;
          
          // Calculate base amount (price excluding GST)
          const baseAmount = (lineTotal * 100) / (100 + gstRate);
          
          // Calculate GST amount
          const gstAmount = lineTotal - baseAmount;
          
          // Split GST into CGST and SGST
          const cgst = gstAmount / 2;
          const sgst = gstAmount / 2;

          return {
            id: item.id,
            cartId: item.id,
            productId: item.productId,
            name: item.product?.name || 'Product',
            hsn: item.effectiveSKU || item.product?.sku || '',
            quantity: quantity,
            price: price, // This now uses effectivePrice for variants
            discount: discount,
            gst: gstRate,
            store: item.product?.category?.name?.toLowerCase().replace(/\s+/g, '_') || '',
            attributeId: item.attributeId,
            attributeName: item.attribute 
              ? `${item.attribute.attributeName}: ${item.attribute.attributeValue}` 
              : null,
            lineTotal: lineTotal,
            baseAmount: baseAmount,
            cgst: cgst,
            sgst: sgst
          };
        });

        setCart(transformedCart);
        recalcSummary(transformedCart);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      setPopupMessage('Failed to load cart items');
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  // Recalculate summary
  const recalcSummary = (updatedCart) => {
    const newSummary = updatedCart.reduce(
      (acc, itm) => {
        const discountAmount = (itm.lineTotal * itm.discount) / 100;
        acc.itemCount += itm.quantity;
        acc.taxable += itm.baseAmount;
        acc.discount += discountAmount;
        acc.cgst += itm.cgst;
        acc.sgst += itm.sgst;
        acc.total += itm.lineTotal - discountAmount;
        return acc;
      },
      { itemCount: 0, taxable: 0, discount: 0, cgst: 0, sgst: 0, total: 0 }
    );
    setSummary(newSummary);
  };

  // Update quantity in API
  const updateQuantity = async (index, newQuantity) => {
    if (newQuantity < 1 || isNaN(newQuantity)) newQuantity = 1;
    
    const item = cart[index];
    
    try {
      const response = await axios.put(
        `${BASE_URL}/cart/${item.cartId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        // Refresh cart to get updated effectivePrice and calculations from backend
        fetchCart();
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setPopupMessage('Failed to update quantity');
      setShowPopup(true);
    }
  };

  // Update discount (local only - API doesn't support this yet)
  const updateDiscount = (index, discountPercent) => {
    if (discountPercent < 0) discountPercent = 0;
    if (discountPercent > 100) discountPercent = 100;

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...updatedCart[index],
      discount: discountPercent
    };

    setCart(updatedCart);
    recalcSummary(updatedCart);
  };

  // Delete item from cart
  const deleteItem = async (index) => {
    const item = cart[index];
    
    try {
      const response = await axios.delete(`${BASE_URL}/cart/${item.cartId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const updatedCart = cart.filter((_, i) => i !== index);
        setCart(updatedCart);
        recalcSummary(updatedCart);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      setPopupMessage('Failed to remove item from cart');
      setShowPopup(true);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {
      customerName: !customerName.trim(),
      mobileNumber: !mobileNumber.trim() || mobileNumber.trim().length < 10,
      address: !address.trim()
    };

    setErrors(newErrors);

    // Check if any error exists
    return !Object.values(newErrors).some(error => error);
  };

  // Generate bill and save to API
  const handleGenerateBill = async () => {
    // Validate form first
    if (!validateForm()) {
      setPopupMessage('Please fill in all required fields correctly');
      setShowPopup(true);
      return;
    }

    if (cart.length === 0) {
      setPopupMessage('Cart is empty! Please add items.');
      setShowPopup(true);
      return;
    }

    try {
      // Prepare bill data for API
      const billPayload = {
        customerName,
        customerContact: mobileNumber,
        address: address,
        paymentMethod: paymentMode,
        items: cart.map(item => ({
          productId: item.productId,
          attributeId: item.attributeId || null,
          quantity: item.quantity,
          price: item.price, // This now includes the correct variant price
          discount: item.discount || 0
        })),
        subtotal: summary.taxable,
        discount: summary.discount,
        cgst: summary.cgst,
        sgst: summary.sgst,
        total: summary.total
      };

      const response = await axios.post(`${BASE_URL}/bills`, billPayload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.success) {
        const billData = {
          billNo: response.data.data.billNumber || `BILL-${Date.now()}`,
          id: response.data.data.id,
          date: new Date().toLocaleDateString('en-IN'),
          time: new Date().toLocaleTimeString('en-IN'),
          customerName,
          mobile: mobileNumber,
          address: address,
          store: cart[0]?.store || 'lakshmi',
          paymentMode,
          cart,
          summary
        };

        // Clear cart after successful bill generation
        await axios.delete(`${BASE_URL}/cart/clear`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Failed to clear cart:', err));

        // Navigate to bill page
        navigate('/bill-page', { state: { billData } });
      }
    } catch (error) {
      console.error('Failed to generate bill:', error);
      const errorMsg = error.response?.data?.message || 'Failed to generate bill';
      setPopupMessage(errorMsg);
      setShowPopup(true);
    }
  };

  return (
    <div className="billing-main-page">
      {/* Popup Modal */}
      {showPopup && (
        <div className="billing-main-popup-overlay">
          <div className="billing-main-popup-modal">
            <div className="billing-main-popup-header">
              <h3>Alert</h3>
              <button 
                className="billing-main-popup-close-btn"
                onClick={() => setShowPopup(false)}
              >
                ×
              </button>
            </div>
            <div className="billing-main-popup-body">
              <p>{popupMessage}</p>
            </div>
            <div className="billing-main-popup-footer">
              <button 
                className="billing-main-popup-btn-ok"
                onClick={() => setShowPopup(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Breadcrumbs */}
      <div className="billing-main-header">
        <div className="breadcrumbs">
          <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
          <i className="bi bi-chevron-right"></i>
          <span className="active">Billing Cart</span>
        </div>
        <h2 className="billing-main-title">
          <i className="bi bi-cart3 me-2"></i> Billing Cart
        </h2>
      </div>

      {loading ? (
        <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
          <i className="bi bi-hourglass-split" style={{ fontSize: '48px' }}></i>
          <p>Loading cart...</p>
        </div>
      ) : (
        <>
          <div className="billing-main-body">
            <div className="billing-main-cart-section">
              <h3><i className="bi bi-cart-check"></i> Cart Items</h3>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <i className="bi bi-cart-x" style={{ fontSize: '48px', color: '#ccc' }}></i>
                  <p>Your cart is empty</p>
                  <button 
                    onClick={() => navigate('/products')}
                    style={{ marginTop: '20px' }}
                    className="billing-main-generate-bill-btn"
                  >
                    <i className="bi bi-box-seam" style={{ marginRight: '8px' }}></i>
                    Browse Products
                  </button>
                </div>
              ) : (
                <table className="billing-main-cart-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Variant</th>
                      <th>HSN</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Taxable</th>    
                      <th>GST%</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>Discount%</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={item.cartId}>
                        <td>{idx + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.attributeName || '-'}</td>
                        <td>{item.hsn}</td>
                        <td>
                          <input
                            type="number"
                            className="billing-main-qty-input"
                            value={item.quantity}
                            min="1"
                            onChange={(e) =>
                              updateQuantity(idx, parseInt(e.target.value) || 1)
                            }
                          />
                        </td>
                        <td>₹{item.price.toFixed(2)}</td>
                        <td>₹{item.baseAmount.toFixed(2)}</td>
                        <td>{item.gst || 0}%</td>
                        <td>₹{item.cgst.toFixed(2)}</td>
                        <td>₹{item.sgst.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            className="billing-main-qty-input"
                            value={item.discount || 0}
                            min="0"
                            max="100"
                            onChange={(e) =>
                              updateDiscount(idx, parseFloat(e.target.value) || 0)
                            }
                          />
                        </td>
                        <td>₹{(item.lineTotal - (item.lineTotal * item.discount) / 100).toFixed(2)}</td>
                        <td>
                          <button 
                            className="billing-main-delete-btn"
                            onClick={() => deleteItem(idx)}
                            title="Delete item"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="billing-main-right-sidebar">
              {/* Enhanced Summary Section */}
              <div className="billing-main-summary-section">
                <h3><i className="bi bi-calculator"></i> Bill Summary</h3>
                <div className="summary-divider"></div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="bi bi-box-seam"></i> Items Count
                  </span>
                  <span className="summary-value">{summary.itemCount}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="bi bi-currency-rupee"></i> Taxable Amount
                  </span>
                  <span className="summary-value">₹{summary.taxable.toFixed(2)}</span>
                </div>
                <div className="summary-row discount-row">
                  <span className="summary-label">
                    <i className="bi bi-tag"></i> Discount
                  </span>
                  <span className="summary-value discount">-₹{summary.discount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="bi bi-percent"></i> CGST
                  </span>
                  <span className="summary-value">₹{summary.cgst.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="bi bi-percent"></i> SGST
                  </span>
                  <span className="summary-value">₹{summary.sgst.toFixed(2)}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row grand-total">
                  <span className="summary-label">
                    <i className="bi bi-cash-stack"></i> Grand Total
                  </span>
                  <span className="summary-value">₹{summary.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="billing-main-customer-details-section">
                <h3><i className="bi bi-person-badge"></i> Customer Details</h3>
                <div className="billing-main-form-group">
                  <label htmlFor="customer-name">
                    Customer Name <span className="required">*</span>
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    className={`billing-main-form-input ${errors.customerName ? 'error' : ''}`}
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setErrors({...errors, customerName: false});
                    }}
                  />
                  {errors.customerName && (
                    <span className="error-message">
                      <i className="bi bi-exclamation-circle"></i> Customer name is required
                    </span>
                  )}
                </div>
                <div className="billing-main-form-group">
                  <label htmlFor="mobile-number">
                    Mobile Number <span className="required">*</span>
                  </label>
                  <input
                    id="mobile-number"
                    type="tel"
                    maxLength="10"
                    className={`billing-main-form-input ${errors.mobileNumber ? 'error' : ''}`}
                    placeholder="Enter 10-digit mobile number"
                    value={mobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setMobileNumber(value);
                      setErrors({...errors, mobileNumber: false});
                    }}
                  />
                  {errors.mobileNumber && (
                    <span className="error-message">
                      <i className="bi bi-exclamation-circle"></i> Valid 10-digit mobile number is required
                    </span>
                  )}
                </div>
                <div className="billing-main-form-group">
                  <label htmlFor="address">
                    Address <span className="required">*</span>
                  </label>
                  <textarea
                    id="address"
                    className={`billing-main-form-input ${errors.address ? 'error' : ''}`}
                    placeholder="Enter customer address"
                    rows="3"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrors({...errors, address: false});
                    }}
                  />
                  {errors.address && (
                    <span className="error-message">
                      <i className="bi bi-exclamation-circle"></i> Address is required
                    </span>
                  )}
                </div>
                <div className="billing-main-form-group">
                  <label htmlFor="payment-mode">
                    Payment Mode <span className="required">*</span>
                  </label>
                  <select
                    id="payment-mode"
                    className="billing-main-form-input"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <button 
                  className="billing-main-generate-bill-btn" 
                  onClick={handleGenerateBill}
                  disabled={cart.length === 0}
                >
                  <i className="bi bi-receipt"></i> Generate Bill
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;