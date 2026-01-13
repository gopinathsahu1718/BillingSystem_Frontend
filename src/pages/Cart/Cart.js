import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Cart.css";
import { useAuth } from "../../context/AuthContext";
import { generateProfessionalBillPDF } from "../PDFGenerator";

const Cart = () => {
  const BASE_URL = "http://13.232.200.172/api";
  const { token } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryType, setCategoryType] = useState(null);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [quantityModal, setQuantityModal] = useState({
    show: false,
    cartId: null,
    currentQuantity: 1,
    newQuantity: 1,
  });

  const [customerDetails, setCustomerDetails] = useState({
    customerName: "",
    customerContact: "",
    customerAddress: "",
    paymentMode: "cash",
  });

  // Validation state for showing red borders
  const [validationErrors, setValidationErrors] = useState({
    customerName: false,
    customerContact: false,
  });

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const items = response.data.data || [];
        setCartItems(items);

        if (items.length > 0 && items[0].product) {
          const category = items[0].product.category?.name;
          setCategoryType(category);
        }
      }
    } catch (error) {
      console.error("Failed to fetch cart items:", error);
      showToast("error", "Error", "Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, title, description) => {
    const id = Date.now();
    setToasts([{ id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const openQuantityModal = (cartId, currentQuantity) => {
    setQuantityModal({
      show: true,
      cartId: cartId,
      currentQuantity: currentQuantity,
      newQuantity: currentQuantity,
    });
  };

  const closeQuantityModal = () => {
    setQuantityModal({
      show: false,
      cartId: null,
      currentQuantity: 1,
      newQuantity: 1,
    });
  };

  const handleQuantityModalChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setQuantityModal({ ...quantityModal, newQuantity: value });
  };

  const handleQuantityUpdate = async () => {
    if (quantityModal.newQuantity < 1) {
      showToast("error", "Error", "Quantity must be at least 1");
      return;
    }

    try {
      await axios.put(
        `${BASE_URL}/cart/${quantityModal.cartId}`,
        { quantity: parseInt(quantityModal.newQuantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCartItems();
      showToast("success", "Success", "Quantity updated");
      closeQuantityModal();
    } catch (error) {
      console.error("Failed to update quantity:", error);
      showToast("error", "Error", "Failed to update quantity");
    }
  };

  const handleQuantityChange = async (cartId, newQuantity) => {
    if (newQuantity < 1 || isNaN(newQuantity)) return;

    try {
      await axios.put(
        `${BASE_URL}/cart/${cartId}`,
        { quantity: parseInt(newQuantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCartItems();
      showToast("success", "Success", "Quantity updated");
    } catch (error) {
      console.error("Failed to update quantity:", error);
      showToast("error", "Error", "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (cartId) => {
    if (!window.confirm("Are you sure you want to remove this item?")) return;

    try {
      await axios.delete(`${BASE_URL}/cart/${cartId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCartItems();
      showToast("success", "Success", "Item removed from cart");
    } catch (error) {
      console.error("Failed to remove item:", error);
      showToast("error", "Error", "Failed to remove item");
    }
  };

  const handleCustomerFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "customerName") {
      // Only allow letters, numbers, dots, and spaces
      // Must start with a letter
      const sanitized = value.replace(/[^a-zA-Z0-9.\s]/g, "");
      
      // If there's content and it doesn't start with a letter, don't update
      if (sanitized && !/^[a-zA-Z]/.test(sanitized)) {
        return;
      }
      
      // Limit to 30 characters
      setCustomerDetails({ 
        ...customerDetails, 
        [name]: sanitized.slice(0, 30) 
      });
      
      // Clear validation error when user types
      setValidationErrors(prev => ({ ...prev, customerName: false }));
    } else if (name === "customerAddress") {
      // Limit address to 40 characters
      setCustomerDetails({ 
        ...customerDetails, 
        [name]: value.slice(0, 40) 
      });
    } else if (name === "customerContact") {
      setCustomerDetails({ ...customerDetails, [name]: value });
      // Clear validation error when user types
      setValidationErrors(prev => ({ ...prev, customerContact: false }));
    } else {
      setCustomerDetails({ ...customerDetails, [name]: value });
    }
  };

  const calculateItemSubtotal = (item) => {
    const price = item.attribute ? parseFloat(item.attribute.price) : parseFloat(item.product.price);
    return (price || 0) * (item.quantity || 0);
  };

  const calculateItemGST = (item) => {
    const gstRate = parseFloat(item.product.gstRate || 0);
    const subtotal = calculateItemSubtotal(item);
    const gstAmount = (subtotal * gstRate) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    return { cgst, sgst, total: gstAmount };
  };

  const calculateItemTotal = (item) => {
    const subtotal = calculateItemSubtotal(item);
    if (categoryType === "laxmi_bookstore") {
      return subtotal;
    }
    const gst = calculateItemGST(item);
    return subtotal + gst.total;
  };

  const calculateCartSummary = () => {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalDiscount = 0;
    let grandTotal = 0;

    cartItems.forEach((item) => {
      const itemSubtotal = calculateItemSubtotal(item);
      subtotal += itemSubtotal;

      const price = item.attribute ? parseFloat(item.attribute.price) : parseFloat(item.product.price);
      const actualPrice = item.attribute ? parseFloat(item.attribute.actualPrice || 0) : parseFloat(item.product.actualPrice || 0);
      if (actualPrice > price) {
        const discount = (actualPrice - price) * (item.quantity || 0);
        totalDiscount += discount;
      }

      if (categoryType !== "laxmi_bookstore") {
        const gst = calculateItemGST(item);
        totalCGST += gst.cgst;
        totalSGST += gst.sgst;
      }
    });

    grandTotal = subtotal + totalCGST + totalSGST;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      cgst: parseFloat(totalCGST.toFixed(2)),
      sgst: parseFloat(totalSGST.toFixed(2)),
      totalGST: parseFloat((totalCGST + totalSGST).toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
    };
  };

  const handleCreateBill = async () => {
    // Reset validation errors
    const errors = {
      customerName: false,
      customerContact: false,
    };

    // Validate customer name
    if (!customerDetails.customerName.trim()) {
      errors.customerName = true;
    }

    // Validate customer contact
    if (!customerDetails.customerContact.trim()) {
      errors.customerContact = true;
    } else if (!/^[6-9]\d{9}$/.test(customerDetails.customerContact)) {
      errors.customerContact = true;
    }

    // Set validation errors
    setValidationErrors(errors);

    // If any errors, show single error message and stop
    if (errors.customerName || errors.customerContact) {
      showToast("error", "Error", "Please fill all the mandatory fields");
      return;
    }

    setGeneratingBill(true);

    try {
      const items = cartItems.map((item) => ({
        productId: item.productId,
        attributeId: item.attributeId || null,
        quantity: item.quantity,
      }));

      const trimmedAddress = customerDetails.customerAddress.trim();
      const customerAddressForBill = trimmedAddress || 'N/A';

      const billData = {
        customerName: customerDetails.customerName.trim(),
        customerContact: customerDetails.customerContact.trim(),
        customerAddress: customerAddressForBill,
        paymentMode: customerDetails.paymentMode,
        items: items,
      };

      const response = await axios.post(`${BASE_URL}/bills`, billData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        showToast("success", "Success", "Bill created successfully!");

        const billId = response.data.data.id;

        // Display PDF in new window instead of downloading
        await displayPDFInNewWindow(billId);

        setCustomerDetails({
          customerName: "",
          customerContact: "",
          customerAddress: "",
          paymentMode: "cash",
        });
        setValidationErrors({
          customerName: false,
          customerContact: false,
        });
        fetchCartItems();
      }
    } catch (error) {
      console.error("Failed to create bill:", error);
      const errorMsg = error.response?.data?.message || "Failed to create bill";
      showToast("error", "Error", errorMsg);
    } finally {
      setGeneratingBill(false);
    }
  };

  const displayPDFInNewWindow = async (billId) => {
    try {
      const response = await axios.get(`${BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        const bill = response.data.data;

        // Generate PDF and get the blob (pass token as 4th parameter)
        const pdfBlob = await generateProfessionalBillPDF(bill, categoryType, true, token);

        if (pdfBlob) {
          // Create blob URL
          const blobUrl = URL.createObjectURL(pdfBlob);

          // Open in new window/tab
          const pdfWindow = window.open(blobUrl, '_blank');

          if (pdfWindow) {
            pdfWindow.document.title = `Bill ${bill.billNumber}`;

            pdfWindow.onload = () => {
              // Cleanup blob URL after window loads
              URL.revokeObjectURL(blobUrl);
            };
          } else {
            showToast("error", "Error", "Please allow popups to view the PDF");
            URL.revokeObjectURL(blobUrl);
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      showToast("error", "Error", "Failed to generate PDF");
    }
  };

  const getCategoryDisplayName = () => {
    if (categoryType === "laxmi_bookstore") return "Laxmi Bookstore";
    if (categoryType === "swasthik_enterprises") return "Swasthik Enterprises";
    return "Unknown Category";
  };

  // Get breadcrumb text based on state
  const getBreadcrumbText = () => {
    if (cartItems.length === 0) {
      return "Empty Cart";
    }
    if (generatingBill) {
      return "Processing Bill";
    }
    // Show "Checkout" if user has filled both mandatory fields
    if (customerDetails.customerName.trim() && customerDetails.customerContact.trim()) {
      return "Ready to Checkout";
    }
    // Show "Filling Details" if user has started filling the form
    if (customerDetails.customerName || customerDetails.customerContact || customerDetails.customerAddress) {
      return "Entering Details";
    }
    return "Shopping Cart";
  };

  const isLaxmiBookstore = categoryType === "laxmi_bookstore";
  const summary = calculateCartSummary();

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading-container">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-page-header">
        <div className="cart-header-content">
          <div className="cart-header-text">
            <h2 className="cart-page-title">
              <i className="bi bi-cart3 me-2"></i>
              Shopping Cart
            </h2>
            <div className="cart-breadcrumbs">
              <span>Cart</span>
              <span className="cart-breadcrumb-separator">&gt;</span>
              <span>{getBreadcrumbText()}</span>
            </div>
          </div>
          {cartItems.length > 0 && (
            <div className="header-badge">
              <span className="badge-number">{cartItems.length}</span>
              <span className="badge-text">Items</span>
            </div>
          )}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <i className="bi bi-cart-x"></i>
          <h3>Your cart is empty</h3>
          <p>Add products to your cart to proceed with billing</p>
        </div>
      ) : (
        <>
          <div className="cart-table-section">
            <div className="cart-table-container">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Sl.No</th>
                    <th>Item Name</th>
                    {cartItems.some(item => item.attribute) && <th>Variant</th>}
                    {!isLaxmiBookstore && <th>HSN</th>}
                    <th>Qty</th>
                    <th>Price</th>
                    {!isLaxmiBookstore && <th>Taxable</th>}
                    {!isLaxmiBookstore && <th>GST %</th>}
                    {!isLaxmiBookstore && <th>CGST</th>}
                    {!isLaxmiBookstore && <th>SGST</th>}
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => {
                    const gst = calculateItemGST(item);
                    const subtotal = calculateItemSubtotal(item);
                    const total = calculateItemTotal(item);
                    const price = parseFloat(item.attribute ? item.attribute.price : item.product.price) || 0;

                    return (
                      <tr key={item.id}>
                        <td data-label="Sl.No">{index + 1}</td>
                        <td data-label="Item Name" className="item-name">
                          {item.product.name}
                        </td>
                        {cartItems.some(i => i.attribute) && (
                          <td data-label="Variant">
                            {item.attribute
                              ? `${item.attribute.attributeName}: ${item.attribute.attributeValue}`
                              : "N/A"}
                          </td>
                        )}
                        {!isLaxmiBookstore && (
                          <td data-label="HSN">{item.product.hsn || "N/A"}</td>
                        )}
                        <td data-label="Qty">
                          <div className="quantity-control">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onClick={() => openQuantityModal(item.id, item.quantity)}
                              readOnly
                              className="quantity-input"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td data-label="Price">
                          Rs {price.toFixed(2)}
                        </td>
                        {!isLaxmiBookstore && (
                          <>
                            <td data-label="Taxable">Rs {subtotal.toFixed(2)}</td>
                            <td data-label="GST %">{item.product.gstRate || 0}%</td>
                            <td data-label="CGST">Rs {gst.cgst.toFixed(2)}</td>
                            <td data-label="SGST">Rs {gst.sgst.toFixed(2)}</td>
                          </>
                        )}
                        <td data-label="Total" className="total-cell">
                          Rs {total.toFixed(2)}
                        </td>
                        <td data-label="Action">
                          <button
                            className="btn-remove-item"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cart-bottom-row">
            <div className="summary-card">
              <div className="summary-header">
                <h3>
                  <i className="bi bi-calculator me-2"></i>
                  Cart Summary
                </h3>
                <div className="category-badge">
                  <i className="bi bi-shop me-1"></i>
                  {getCategoryDisplayName()}
                </div>
              </div>

              <div className="summary-body">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>Rs {summary.subtotal}</span>
                </div>
                {parseFloat(summary.discount) > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount:</span>
                    <span className="discount-amount">-Rs {summary.discount}</span>
                  </div>
                )}
                {!isLaxmiBookstore && (
                  <>
                    <div className="summary-row">
                      <span>CGST:</span>
                      <span>Rs {summary.cgst}</span>
                    </div>
                    <div className="summary-row">
                      <span>SGST:</span>
                      <span>Rs {summary.sgst}</span>
                    </div>
                    <div className="summary-row">
                      <span>Total GST:</span>
                      <span>Rs {summary.totalGST}</span>
                    </div>
                  </>
                )}
                <div className="summary-row grand-total">
                  <span>Grand Total:</span>
                  <span>Rs {summary.grandTotal}</span>
                </div>
              </div>
            </div>

            <div className="customer-card">
              <h4>
                <i className="bi bi-person-fill me-2"></i>
                Customer Details
              </h4>
              <div className="form-group">
                <label>
                  Customer Name <span className="required">*</span>
                </label>
                <div className="input-with-counter">
                  <input
                    type="text"
                    name="customerName"
                    placeholder="Enter customer name"
                    value={customerDetails.customerName}
                    onChange={handleCustomerFormChange}
                    maxLength="30"
                    required
                    className={validationErrors.customerName ? 'input-invalid' : ''}
                  />
                  <span className="char-count-inside">{customerDetails.customerName.length}/30</span>
                </div>
              </div>
              <div className="form-group">
                <label>
                  Contact Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="customerContact"
                  placeholder="10-digit mobile number"
                  value={customerDetails.customerContact}
                  onChange={handleCustomerFormChange}
                  maxLength="10"
                  required
                  className={validationErrors.customerContact ? 'input-invalid' : ''}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <div className="textarea-with-counter">
                  <textarea
                    name="customerAddress"
                    placeholder="Enter customer address (optional)"
                    value={customerDetails.customerAddress}
                    onChange={handleCustomerFormChange}
                    rows="2"
                    maxLength="40"
                  />
                  <span className="char-count-inside-textarea">{customerDetails.customerAddress.length}/40</span>
                </div>
              </div>
              <div className="form-group">
                <label>Payment Mode <span className="required">*</span></label>
                <select
                  name="paymentMode"
                  value={customerDetails.paymentMode}
                  onChange={handleCustomerFormChange}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                className="btn-create-bill"
                onClick={handleCreateBill}
                disabled={generatingBill}
              >
                {generatingBill ? (
                  <>
                    <i className="bi bi-hourglass-split me-2"></i>
                    Creating Bill...
                  </>
                ) : (
                  <>
                    <i className="bi bi-receipt me-2"></i>
                    Create Bill
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {quantityModal.show && (
        <div className="modal-overlay" onClick={closeQuantityModal}>
          <div className="quantity-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="quantity-modal-header">
              <h3>
                <i className="bi bi-123 me-2"></i>
                Update Quantity
              </h3>
              <button className="modal-close-btn" onClick={closeQuantityModal}>
                ×
              </button>
            </div>
            <div className="quantity-modal-body">
              <p className="quantity-modal-label">Enter new quantity:</p>
              <div className="quantity-modal-input-group">
                <button
                  className="qty-modal-btn"
                  onClick={() => setQuantityModal({ ...quantityModal, newQuantity: Math.max(1, quantityModal.newQuantity - 1) })}
                  disabled={quantityModal.newQuantity <= 1}
                >
                  <i className="bi bi-dash-lg"></i>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantityModal.newQuantity}
                  onChange={handleQuantityModalChange}
                  className="quantity-modal-input"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQuantityUpdate();
                    }
                  }}
                />
                <button
                  className="qty-modal-btn"
                  onClick={() => setQuantityModal({ ...quantityModal, newQuantity: quantityModal.newQuantity + 1 })}
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              </div>
              <p className="quantity-modal-hint">
                Current quantity: <strong>{quantityModal.currentQuantity}</strong>
              </p>
            </div>
            <div className="quantity-modal-footer">
              <button className="btn-cancel-qty" onClick={closeQuantityModal}>
                Cancel
              </button>
              <button className="btn-update-qty" onClick={handleQuantityUpdate}>
                <i className="bi bi-check-lg me-2"></i>
                Update Quantity
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-notification ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon"></span>
              <div className="toast-body">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-description">{toast.description}</div>
              </div>
              <button
                className="toast-close"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cart;