import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BillingReport.css';
import { FaSearch, FaEye, FaDownload, FaTrash } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const BASE_URL = 'http://13.232.200.172/api';

const BillingReport = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    paymentMode: "",
    isActive: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, billId: null });
  const [successMessage, setSuccessMessage] = useState({ show: false, message: '' });

  // Fetch bills from API
  const fetchBills = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const billsData = response.data.data || [];
        
        // Transform API data to match component structure
        const transformedBills = billsData.map(bill => {
          // Prefer API's grandTotal/total fields, fallback to derived sums
          let calculatedTotal = parseFloat(bill.grandTotal ?? bill.total ?? 0);
          
          if (calculatedTotal === 0 && bill.billItems && bill.billItems.length > 0) {
            calculatedTotal = bill.billItems.reduce((sum, item) => {
              const itemTotal = parseFloat(item.price || 0) * parseInt(item.quantity || 0);
              return sum + itemTotal;
            }, 0);
          }

          if (calculatedTotal === 0) {
            const subtotal = parseFloat(bill.subtotal || 0);
            const cgst = parseFloat(bill.cgst || 0);
            const sgst = parseFloat(bill.sgst || 0);
            const discount = parseFloat(bill.discount || 0);
            calculatedTotal = subtotal + cgst + sgst - discount;
          }

          return {
            id: bill.id,
            billNumber: bill.billNumber,
            customerName: bill.customerName || 'Customer',
            customerContact: bill.customerContact || '',
            paymentMode: bill.paymentMethod?.toLowerCase() || 'cash',
            grandTotal: calculatedTotal,
            totalGST: parseFloat(bill.cgst || 0) + parseFloat(bill.sgst || 0),
            subtotal: parseFloat(bill.subtotal || 0),
            discount: parseFloat(bill.discount || 0),
            cgst: parseFloat(bill.cgst || 0),
            sgst: parseFloat(bill.sgst || 0),
            isActive: bill.status !== 'cancelled',
            createdAt: bill.createdAt || new Date().toISOString(),
            items: bill.billItems || []
          };
        });

        setBills(transformedBills);
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [token]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter bills based on search and filter criteria
  const filteredBills = bills.filter((bill) => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = 
      bill.billNumber.toLowerCase().includes(searchLower) ||
      bill.customerName.toLowerCase().includes(searchLower) ||
      bill.customerContact.includes(searchLower);

    const matchesPayment = !filters.paymentMode || bill.paymentMode === filters.paymentMode;
    
    const matchesStatus = !filters.isActive || 
      (filters.isActive === 'active' ? bill.isActive : !bill.isActive);

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handlePaymentModeChange = (e) => {
    setFilters({ ...filters, paymentMode: e.target.value });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, isActive: e.target.value });
  };

  const handleClearSearch = () => {
    setFilters({ search: "", paymentMode: "", isActive: "" });
  };

  const handleResetFilters = () => {
    setFilters({ search: "", paymentMode: "", isActive: "" });
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleDelete = (billId) => {
    setDeleteConfirm({ isOpen: true, billId });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.billId) {
      try {
        // Try the /disable endpoint first (based on the error message)
        const response = await axios.put(
          `${BASE_URL}/bills/${deleteConfirm.billId}/disable`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data?.success) {
          // Remove the bill from local state or mark it as inactive
          setBills((prev) => prev.filter(bill => bill.id !== deleteConfirm.billId));
          setCurrentPage(1);
          setSuccessMessage({ show: true, message: 'Bill deleted successfully!' });
          setTimeout(() => setSuccessMessage({ show: false, message: '' }), 3000);
        }
      } catch (error) {
        console.error('Failed to delete bill:', error);
        
        // Provide more specific error message
        const errorMsg = error.response?.data?.message || 'Failed to delete bill. Please try again.';
        setSuccessMessage({ show: true, message: errorMsg });
        setTimeout(() => setSuccessMessage({ show: false, message: '' }), 3000);
      } finally {
        setDeleteConfirm({ isOpen: false, billId: null });
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, billId: null });
  };

  const handleView = async (billId) => {
    try {
      const response = await axios.get(`${BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const billDetail = response.data.data;
        
        // Transform bill items to match BillPage format
        const transformedCart = billDetail.billItems?.map((item, index) => {
          // Use the price from the bill item (which should already be the correct variant price)
          const price = parseFloat(item.price || 0);
          const quantity = parseInt(item.quantity || 1);
          const gstRate = parseFloat(item.product?.gstRate || 0);
          const discountPercent = parseFloat(item.discount || 0);
          
          // Calculate amounts
          const lineTotal = price * quantity;
          const baseAmount = (lineTotal * 100) / (100 + gstRate);
          const gstAmount = lineTotal - baseAmount;
          const cgst = gstAmount / 2;
          const sgst = gstAmount / 2;
          const discountAmount = (lineTotal * discountPercent) / 100;
          const total = lineTotal - discountAmount;
          
          return {
            id: index + 1,
            name: item.product?.name || 'Product',
            hsn: item.product?.sku || '',
            qty: quantity,
            rate: price,
            discount: discountPercent,
            taxable: baseAmount,
            cgst: cgst,
            sgst: sgst,
            cgstRate: gstRate / 2,
            sgstRate: gstRate / 2,
            total: total,
            attributeName: item.attribute 
              ? `${item.attribute.attributeName}: ${item.attribute.attributeValue}` 
              : null
          };
        }) || [];

        // Calculate summary from transformed items
        const summary = transformedCart.reduce(
          (acc, item) => {
            acc.itemCount += item.qty;
            acc.taxable += item.taxable;
            acc.discount += (item.rate * item.qty * item.discount) / 100;
            acc.cgst += item.cgst;
            acc.sgst += item.sgst;
            acc.total += item.total;
            return acc;
          },
          { itemCount: 0, taxable: 0, discount: 0, cgst: 0, sgst: 0, total: 0 }
        );

        // Create bill data matching BillPage format
        const billData = {
          billNo: billDetail.billNumber,
          id: billDetail.id,
          date: new Date(billDetail.createdAt).toLocaleDateString('en-IN'),
          time: new Date(billDetail.createdAt).toLocaleTimeString('en-IN'),
          customerName: billDetail.customerName || 'Customer',
          mobile: billDetail.customerContact || '',
          contactNo: billDetail.customerContact || '',
          address: billDetail.address || '',
          paymentMode: billDetail.paymentMethod || 'cash',
          store: billDetail.store || 'lakshmi',
          items: transformedCart, // BillPage expects 'items' array
          cart: transformedCart,   // Keep both for compatibility
          summary: summary,
          grandTotal: summary.total
        };

        // Navigate to bill page
        navigate('/bill-page', { state: { billData } });
      }
    } catch (error) {
      console.error('Failed to fetch bill details:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load bill details';
      setSuccessMessage({ show: true, message: errorMsg });
      setTimeout(() => setSuccessMessage({ show: false, message: '' }), 3000);
    }
  };

  const handleDownload = async (billId) => {
    try {
      setSuccessMessage({ show: true, message: 'Preparing bill for download...' });
      
      // Fetch the bill details
      const response = await axios.get(`${BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        const billDetail = response.data.data;
        
        // Transform bill items to match BillPage format (same as handleView)
        const transformedCart = billDetail.billItems?.map((item, index) => {
          const price = parseFloat(item.price || 0);
          const quantity = parseInt(item.quantity || 1);
          const gstRate = parseFloat(item.product?.gstRate || 0);
          const discountPercent = parseFloat(item.discount || 0);
          
          const lineTotal = price * quantity;
          const baseAmount = (lineTotal * 100) / (100 + gstRate);
          const gstAmount = lineTotal - baseAmount;
          const cgst = gstAmount / 2;
          const sgst = gstAmount / 2;
          const discountAmount = (lineTotal * discountPercent) / 100;
          const total = lineTotal - discountAmount;
          
          return {
            id: index + 1,
            name: item.product?.name || 'Product',
            hsn: item.product?.sku || '',
            qty: quantity,
            rate: price,
            discount: discountPercent,
            taxable: baseAmount,
            cgst: cgst,
            sgst: sgst,
            cgstRate: gstRate / 2,
            sgstRate: gstRate / 2,
            total: total,
            attributeName: item.attribute 
              ? `${item.attribute.attributeName}: ${item.attribute.attributeValue}` 
              : null
          };
        }) || [];

        // Calculate summary
        const summary = transformedCart.reduce(
          (acc, item) => {
            acc.itemCount += item.qty;
            acc.taxable += item.taxable;
            acc.discount += (item.rate * item.qty * item.discount) / 100;
            acc.cgst += item.cgst;
            acc.sgst += item.sgst;
            acc.total += item.total;
            return acc;
          },
          { itemCount: 0, taxable: 0, discount: 0, cgst: 0, sgst: 0, total: 0 }
        );

        // Create bill data matching BillPage format
        const billData = {
          billNo: billDetail.billNumber,
          id: billDetail.id,
          date: new Date(billDetail.createdAt).toLocaleDateString('en-IN'),
          time: new Date(billDetail.createdAt).toLocaleTimeString('en-IN'),
          customerName: billDetail.customerName || 'Customer',
          mobile: billDetail.customerContact || '',
          contactNo: billDetail.customerContact || '',
          address: billDetail.address || '',
          paymentMode: billDetail.paymentMethod || 'cash',
          store: billDetail.store || 'lakshmi',
          items: transformedCart,
          cart: transformedCart,
          summary: summary,
          grandTotal: summary.total,
          downloadMode: true
        };

        // Navigate to BillPage with download flag
        navigate('/bill-page', { 
          state: { 
            billData,
            autoDownload: true
          } 
        });

        setSuccessMessage({ show: true, message: 'Redirecting to bill page...' });
        setTimeout(() => setSuccessMessage({ show: false, message: '' }), 2000);
      }
    } catch (error) {
      console.error('Failed to download bill:', error);
      const errorMsg = error.response?.data?.message || 'Failed to download bill. Please try again.';
      setSuccessMessage({ show: true, message: errorMsg });
      setTimeout(() => setSuccessMessage({ show: false, message: '' }), 3000);
    }
  };

  return (
    <div className="billing-report-container">
      {/* Header Section with Breadcrumbs */}
      <div className="billing-report-header">
        <div className="breadcrumbs">
          <span onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
          <i className="bi bi-chevron-right"></i>
          <span className="active">Billing Reports</span>
        </div>
        <h2 className="billing-report-title">
          <i className="bi bi-receipt me-2"></i> Billing Reports
        </h2>
      </div>

      {/* Filters & Search Bar */}
      <div className="billing-report-filters-section">
        <div className="billing-report-filters-row">
          {/* Search Input */}
          <div className="billing-report-filter-group" style={{ flex: 3 }}>
            <label className="billing-report-filter-label">Search Records</label>
            <div className="billing-report-search-input-wrapper">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by Bill #, Customer Name or Phone..."
                value={filters.search}
                onChange={handleSearchChange}
              />
              {filters.search && (
                <button
                  type="button"
                  className="billing-report-clear-search-btn"
                  onClick={handleClearSearch}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
          </div>

          {/* Payment Filter */}
          <div className="billing-report-filter-group" style={{ flex: 0.8 }}>
            <label className="billing-report-filter-label">Payment Mode</label>
            <select value={filters.paymentMode} onChange={handlePaymentModeChange}>
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit Card</option>
              <option value="debit">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          
          {/* Reset Button */}
          <button className="billing-report-reset-btn" onClick={handleResetFilters}>Reset Filter</button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="billing-report-table-wrapper">
        <div className="billing-report-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <i className="bi bi-hourglass-split" style={{ fontSize: '48px' }}></i>
              <p>Loading bills...</p>
            </div>
          ) : (
            <table className="billing-report-billing-table">
              <thead>
                <tr>
                  <th>Bill Details</th>
                  <th>Customer Info</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'center', width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="billing-report-empty-state">
                      No bills have been generated yet.
                    </td>
                  </tr>
                ) : (
                  paginatedBills.map((bill) => (
                    <tr key={bill.id}>
                      {/* Bill Info */}
                      <td>
                        <div className="billing-report-bill-number">{bill.billNumber}</div>
                        <div className="billing-report-bill-date">{formatDate(bill.createdAt)}</div>
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div className="billing-report-customer-name">{bill.customerName}</div>
                        <div className="billing-report-customer-contact">{bill.customerContact}</div>
                      </td>

                      {/* Payment Mode */}
                      <td>
                        <PaymentBadge mode={bill.paymentMode} />
                      </td>

                      {/* Amounts */}
                      <td className="billing-report-amount-column">
                        <div className="billing-report-amount-value">{formatCurrency(bill.grandTotal)}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="billing-report-action-buttons">
                          <button 
                            className="billing-report-action-btn billing-report-btn-view" 
                            title="View Bill"
                            onClick={() => handleView(bill.id)}
                          >
                            <FaEye size={14} />
                            <span>View</span>
                          </button>
                          <button 
                            className="billing-report-action-btn billing-report-btn-download" 
                            title="Download Bill"
                            onClick={() => handleDownload(bill.id)}
                          >
                            <FaDownload size={14} />
                            <span>Download</span>
                          </button>
                          <button 
                            className="billing-report-action-btn billing-report-btn-delete" 
                            title="Delete Bill"
                            onClick={() => handleDelete(bill.id)}
                          >
                            <FaTrash size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {!loading && filteredBills.length > 0 && (
          <div className="billing-report-pagination-wrapper">
            <div className="billing-report-pagination-buttons">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={currentPage === page ? 'billing-report-active' : ''}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="billing-report-popup-overlay" onClick={cancelDelete}>
          <div className="billing-report-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="billing-report-popup-header">
              <h3>Delete Bill</h3>
              <button 
                className="billing-report-popup-close-btn" 
                onClick={cancelDelete}
              >
                ×
              </button>
            </div>
            <div className="billing-report-popup-body">
              <p>Are you sure you want to delete this bill? This action cannot be undone.</p>
            </div>
            <div className="billing-report-popup-footer">
              <button 
                className="billing-report-popup-btn-cancel" 
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className="billing-report-popup-btn-delete" 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Toast */}
      {successMessage.show && (
        <div className="billing-report-success-toast">
          <div className="billing-report-toast-content">
            <i className="bi bi-check-circle-fill"></i>
            <span>{successMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for Cleaner Code ---

const PaymentBadge = ({ mode }) => {
  const badgeClasses = {
    cash: "billing-report-badge-cash",
    credit: "billing-report-badge-card",
    debit: "billing-report-badge-card",
    upi: "billing-report-badge-upi",
    cheque: "billing-report-badge-netbanking",
    default: "billing-report-badge-cash"
  };

  const modeLabels = {
    cash: "Cash",
    credit: "Credit Card",
    debit: "Debit Card",
    upi: "UPI",
    cheque: "Cheque"
  };

  const badgeClass = badgeClasses[mode] || badgeClasses.default;
  const label = modeLabels[mode] || mode;

  return (
    <span className={`billing-report-payment-badge ${badgeClass}`}>
      {label}
    </span>
  );
};

export default BillingReport;