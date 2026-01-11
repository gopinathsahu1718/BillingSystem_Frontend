import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Cart.css';
import itemsData from '../../context/itemsData'; 

const Cart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState({
    itemCount: 0,
    taxable: 0,
    discount: 0,
    cgst: 0,
    sgst: 0,
    total: 0
  });

  // Restore cart data when coming back from template
  useEffect(() => {
    if (location.state?.cart) {
      const restoredCart = location.state.cart.map(item => ({
        ...item,
        quantity: parseInt(item.qty) || item.quantity || 1,
        price: parseFloat(item.rate) || item.price || 0,
        discount: item.discount || 0,
        lineTotal: parseFloat(item.lineTotal) || parseFloat(item.total) || 0,
        baseAmount: parseFloat(item.baseAmount) || parseFloat(item.taxable) || 0,
        cgst: parseFloat(item.cgst) || 0,
        sgst: parseFloat(item.sgst) || 0
      }));
      setCart(restoredCart);
      
      // Recalculate summary based on restored cart
      if (location.state?.summary && location.state.summary.total > 0) {
        setSummary(location.state.summary);
      } else {
        // Recalculate if summary is missing or has zero total
        const newSummary = restoredCart.reduce(
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
      }
    }
    
    // Restore customer details
    if (location.state?.customerName) {
      setCustomerName(location.state.customerName);
    }
    if (location.state?.mobileNumber) {
      setMobileNumber(location.state.mobileNumber);
    }
    if (location.state?.paymentMode) {
      setPaymentMode(location.state.paymentMode);
    }
    if (location.state?.store) {
      setCustomer(location.state.store);
    }
  }, [location]);

  const addItem = (item) => {
    // store selection
    if (!customer) {
      setPopupMessage('Please select a store first');
      setShowPopup(true);
      return;
    }
    // store validation
    if (item.store !== customer) {
      setPopupMessage(`${item.name} is not available in ${customer === 'swasthik' ? 'Swasthik Enterprise' : 'Lakshmi Bookstore'}`);
      setShowPopup(true);
      return;
    }

    const existingIndex = cart.findIndex(
      (cartItem) => cartItem.name === item.name && cartItem.hsn === item.hsn
    );
    let updatedCart;
    // logic to add item 
    if (existingIndex !== -1) {
      const existingItem = cart[existingIndex];
      const newQuantity = existingItem.quantity + 1;
    //logic to recalculate
      const gstPercent = item.gst || 0;
      const lineTotal = item.price * newQuantity;
      const baseAmount = (lineTotal * 100) / (100 + gstPercent);
      const gstAmount = lineTotal - baseAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      const updatedItem = {
        ...existingItem,
        quantity: newQuantity,
        lineTotal,
        baseAmount,
        cgst,
        sgst
      };

      updatedCart = [...cart];
      updatedCart[existingIndex] = updatedItem;
    } else {
      const gstPercent = item.gst || 0;
      const lineTotal = item.price * 1;
      const baseAmount = (lineTotal * 100) / (100 + gstPercent);
      const gstAmount = lineTotal - baseAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      const newItem = {
        ...item,
        quantity: 1,
        discount: 0,
        lineTotal,
        baseAmount,
        cgst,
        sgst
      };

      updatedCart = [...cart, newItem];
    }

    setCart(updatedCart);
    recalcSummary(updatedCart);
  };
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

  // Search 
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Generate suggestions - only items starting with search term
    if (value.trim()) {
      const filtered = itemsData.filter((item) =>
        item.name.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item) => {
    addItem(item);
    setSearch('');
    setSuggestions([]);
  };

  // Legacy search handler for form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const foundItem = itemsData.find((itm) =>
      itm.name.toLowerCase().startsWith(search.toLowerCase())
    );

    if (foundItem) {
      addItem(foundItem);
      setSearch('');
      setSuggestions([]);
    } else {
      alert("Item not found!");
    }
  };
// update quantity
  const updateQuantity = (index, newQuantity) => {
  if (newQuantity < 1 || isNaN(newQuantity)) newQuantity = 1; 
  const updatedCart = [...cart];
  const item = updatedCart[index];
// Recalculate amounts after update 
  const gstPercent = item.gst || 0;
  const lineTotal = item.price * newQuantity;
  const baseAmount = (lineTotal * 100) / (100 + gstPercent);
  const gstAmount = lineTotal - baseAmount;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  updatedCart[index] = {
    ...item,
    quantity: newQuantity,
    lineTotal,
    baseAmount,
    cgst,
    sgst
  };

  setCart(updatedCart);
  recalcSummary(updatedCart);
};

// update discount
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
// delete item
  const deleteItem = (index) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    recalcSummary(updatedCart);
  };
// generate bill
  const handleGenerateBill = () => {
    if (!customerName.trim() || !mobileNumber.trim()) {
      setPopupMessage('Please fill in customer name and mobile number');
      setShowPopup(true);
      return;
    }
    if (cart.length === 0) {
      setPopupMessage('Cart is empty! Please add items.');
      setShowPopup(true);
      return;
    }

    const billData = {
      billNo: `BILL-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString('en-IN'),
      customerName,
      mobile: mobileNumber,
      store: customer,
      paymentMode,
      cart,
      summary
    };

    // Navigate to BillPage with bill data
    navigate('/bill-page', { state: { billData } });
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

      {/* Header */}
      <div className="billing-main-header">
        <h2 className="billing-main-title">
          <i className="bi bi-receipt me-2"></i> Billing
        </h2>
      </div>

      {/* Search */}
      <form className="billing-main-search-section" onSubmit={handleSearchSubmit}>
        <div className="billing-main-search-container">
          <div className="billing-main-search-row">
            <div className="billing-main-search-input-wrapper">
              <input
                type="text"
                className="billing-main-search-input"
                placeholder="Search items for billing..."
                value={search}
                onChange={handleSearch}
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  className="billing-main-clear-search-btn"
                  onClick={() => {
                    setSearch('');
                    setSuggestions([]);
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <ul className="billing-main-suggestions-list">
                  {suggestions.map((item, idx) => (
                    <li
                      key={idx}
                      className="billing-main-suggestion-item"
                      onClick={() => handleSelectSuggestion(item)}
                    >
                      <span className="billing-main-suggestion-name">{item.name}</span>
                      <span className="billing-main-suggestion-price">₹{item.price}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="billing-main-add-btn">
              Add Item
            </button>
          </div>
        </div>
      </form>

      <div className="billing-main-body">
        <div className="billing-main-cart-section">
          <h3>Cart</h3>
          <table className="billing-main-cart-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
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
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
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
                  <td>₹{item.price}</td>
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
        </div>

        <div className="billing-main-right-sidebar">
          <div className="billing-main-customer-section">
            <label className="mb-2 d-block">Select Store:</label>
            <div className="billing-main-store-buttons">
              <button
                type="button"
                className={`billing-main-store-btn ${customer === 'swasthik' ? 'billing-main-active' : ''}`}
                onClick={() => setCustomer('swasthik')}
              >
                Swasthik Enterprise
              </button>
              <button
                type="button"
                className={`billing-main-store-btn ${customer === 'lakshmi' ? 'billing-main-active' : ''}`}
                onClick={() => setCustomer('lakshmi')}
              >
                Lakshmi Bookstore
              </button>
            </div>
          </div>

          <div className="billing-main-summary-section">
            <h3>Summary</h3>
            <p>Items Count: {summary.itemCount}</p>
            <p>Taxable Amount: ₹{summary.taxable.toFixed(2)}</p>
            <p>Discount: -₹{summary.discount.toFixed(2)}</p>
            <p>CGST: ₹{summary.cgst.toFixed(2)}</p>
            <p>SGST: ₹{summary.sgst.toFixed(2)}</p>
            <h2>Grand Total: ₹{summary.total.toFixed(2)}</h2>
          </div>

          <div className="billing-main-customer-details-section">
            <h3>Customer Details</h3>
            <div className="billing-main-form-group">
              <label htmlFor="customer-name">Customer Name:</label>
              <input
                id="customer-name"
                type="text"
                className="billing-main-form-input"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="billing-main-form-group">
              <label htmlFor="mobile-number">Mobile Number:</label>
              <input
                id="mobile-number"
                type="tel"
                className="billing-main-form-input"
                placeholder="Enter mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
            <div className="billing-main-form-group">
              <label htmlFor="payment-mode">Payment Mode:</label>
              <select
                id="payment-mode"
                className="billing-main-form-input"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit Card</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <button className="billing-main-generate-bill-btn" onClick={handleGenerateBill}>
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;