import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BillingReport.css";
import { useAuth } from "../../context/AuthContext";
import { generateProfessionalBillPDF } from "../PDFGenerator";

const BillingReport = () => {
  const BASE_URL = "http://13.232.200.172/api";
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState("laxmi_bookstore");
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [viewingBill, setViewingBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const BILLS_PER_PAGE = 8;

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, activeTab, searchQuery, paymentModeFilter, statusFilter, dateFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setBills(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch bills:", error);
      showToast("error", "Error", "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    let filtered = bills;

    // Category filter
    filtered = filtered.filter((bill) => {
      if (bill.items && bill.items.length > 0) {
        const category = getCategoryFromBill(bill);
        return category === activeTab;
      }
      return false;
    });

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber.toLowerCase().includes(query) ||
          bill.customerName.toLowerCase().includes(query) ||
          bill.customerContact.includes(query)
      );
    }

    // Payment mode filter
    if (paymentModeFilter !== "all") {
      filtered = filtered.filter((bill) => bill.paymentMode === paymentModeFilter);
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((bill) => bill.isActive === 1);
    } else if (statusFilter === "disabled") {
      filtered = filtered.filter((bill) => bill.isActive === 0);
    }

    // Date range filter
    if (dateFilter.startDate) {
      filtered = filtered.filter((bill) => {
        const billDate = new Date(bill.createdAt);
        const startDate = new Date(dateFilter.startDate);
        return billDate >= startDate;
      });
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter((bill) => {
        const billDate = new Date(bill.createdAt);
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        return billDate <= endDate;
      });
    }

    setFilteredBills(filtered);
    setCurrentPage(1);
  };

  const getCategoryFromBill = (bill) => {
    if (parseFloat(bill.totalGST) > 0) {
      return "swasthik_enterprises";
    }
    return "laxmi_bookstore";
  };

  const showToast = (type, title, description) => {
    const id = Date.now();
    setToasts([{ id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handleViewBill = async (billId) => {
    try {
      const response = await axios.get(`${BASE_URL}/bills/${billId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setViewingBill(response.data.data);
        setShowBillModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch bill details:", error);
      showToast("error", "Error", "Failed to load bill details");
    }
  };

  const handleDownloadBill = async (bill) => {
    try {
      const category = getCategoryFromBill(bill);
      await generateProfessionalBillPDF(bill, category, false, token);
      showToast("success", "Success", "PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      showToast("error", "Error", "Failed to download PDF");
    }
  };

  const handleToggleBillStatus = async (billId, currentStatus) => {
    const action = currentStatus === 1 ? 'disable' : 'enable';
    const confirmMsg = currentStatus === 1
      ? 'Are you sure you want to disable this bill?'
      : 'Are you sure you want to enable this bill?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await axios.put(
        `${BASE_URL}/bills/${billId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.success) {
        showToast("success", "Success", `Bill ${action}d successfully`);
        fetchBills();
      }
    } catch (error) {
      console.error(`Failed to ${action} bill:`, error);
      showToast("error", "Error", `Failed to ${action} bill`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPaymentModeFilter("all");
    setStatusFilter("all");
    setDateFilter({ startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  const indexOfLastBill = currentPage * BILLS_PER_PAGE;
  const indexOfFirstBill = indexOfLastBill - BILLS_PER_PAGE;
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(filteredBills.length / BILLS_PER_PAGE);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="billing-container">
        <div className="loading-container">
          <i className="bi bi-hourglass-split"></i>
          <p>Loading billing reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 className="page-title">
              <i className="bi bi-receipt me-2"></i>
              Billing Reports
            </h2>
            <div className="breadcrumbs">View and manage all billing records</div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{bills.length}</span>
              <span className="stat-label">Total Bills</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{filteredBills.length}</span>
              <span className="stat-label">Filtered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="billing-tabs">
        <button
          className={activeTab === "laxmi_bookstore" ? "active" : ""}
          onClick={() => setActiveTab("laxmi_bookstore")}
        >
          <i className="bi bi-book me-2"></i>
          Laxmi Bookstore
        </button>
        <button
          className={activeTab === "swasthik_enterprises" ? "active" : ""}
          onClick={() => setActiveTab("swasthik_enterprises")}
        >
          <i className="bi bi-shop me-2"></i>
          Swasthik Enterprises
        </button>
      </div>

      <div className="billing-controls">
        <div className="search-box">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            placeholder="Search by Bill #, Customer Name or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <input
          type="date"
          className="date-filter"
          value={dateFilter.startDate}
          onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
          placeholder="Start Date"
          title="Start Date"
        />

        <input
          type="date"
          className="date-filter"
          value={dateFilter.endDate}
          onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
          placeholder="End Date"
          title="End Date"
        />

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="disabled">Disabled Only</option>
        </select>

        <select
          className="payment-filter"
          value={paymentModeFilter}
          onChange={(e) => setPaymentModeFilter(e.target.value)}
        >
          <option value="all">All Modes</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="netbanking">Net Banking</option>
          <option value="other">Other</option>
        </select>

        <button className="btn-reset" onClick={handleResetFilters}>
          <i className="bi bi-arrow-clockwise me-2"></i>
          Reset
        </button>
      </div>

      {currentBills.length === 0 ? (
        <div className="no-bills">
          <i className="bi bi-inbox"></i>
          <h3>No bills found</h3>
          <p>There are no billing records matching your filters</p>
        </div>
      ) : (
        <>
          <div className="bills-table-container">
            <table className="bills-table">
              <thead>
                <tr>
                  <th>BILL DETAILS</th>
                  <th>CUSTOMER INFO</th>
                  <th>PAYMENT</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {currentBills.map((bill) => (
                  <tr key={bill.id} className={bill.isActive === 0 ? 'disabled-row' : ''}>
                    <td data-label="Bill Details">
                      <div className="bill-details-cell">
                        <div className="bill-number-main">
                          {bill.billNumber}
                          {bill.isActive === 0 && (
                            <span className="status-badge disabled">Disabled</span>
                          )}
                        </div>
                        <div className="bill-date">
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="bill-time">
                          {new Date(bill.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </td>
                    <td data-label="Customer Info">
                      <div className="customer-cell">
                        <div className="customer-name">{bill.customerName}</div>
                        <div className="customer-phone">{bill.customerContact}</div>
                      </div>
                    </td>
                    <td data-label="Payment">
                      <span className={`payment-badge ${bill.paymentMode}`}>
                        {bill.paymentMode.toUpperCase()}
                      </span>
                    </td>
                    <td data-label="Amount">
                      <div className="amount-cell">
                        Rs {parseFloat(bill.grandTotal).toFixed(2)}
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`status-indicator ${bill.isActive === 1 ? 'active' : 'inactive'}`}>
                        <i className={`bi ${bill.isActive === 1 ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                        {bill.isActive === 1 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button
                          className="btn-view-small"
                          onClick={() => handleViewBill(bill.id)}
                          title="View Bill"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn-download-small"
                          onClick={() => handleDownloadBill(bill)}
                          title="Download PDF"
                        >
                          <i className="bi bi-download"></i>
                        </button>
                        <button
                          className={`btn-toggle-small ${bill.isActive === 1 ? 'btn-disable' : 'btn-enable'}`}
                          onClick={() => handleToggleBillStatus(bill.id, bill.isActive)}
                          title={bill.isActive === 1 ? 'Disable Bill' : 'Enable Bill'}
                        >
                          <i className={`bi ${bill.isActive === 1 ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {showBillModal && viewingBill && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal-content-bill" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bill Preview - {viewingBill.billNumber}</h3>
              <button className="modal-close" onClick={() => setShowBillModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body-bill">
              <div className="bill-preview-container">
                <div className="preview-section">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {viewingBill.customerName}</p>
                  <p><strong>Contact:</strong> {viewingBill.customerContact}</p>
                  {viewingBill.customerAddress && (
                    <p><strong>Address:</strong> {viewingBill.customerAddress}</p>
                  )}
                  <p><strong>Payment Mode:</strong> {viewingBill.paymentMode.toUpperCase()}</p>
                  <p><strong>Status:</strong>
                    <span className={`status-indicator ${viewingBill.isActive === 1 ? 'active' : 'inactive'}`}>
                      {viewingBill.isActive === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </p>
                </div>

                <div className="preview-section">
                  <h4>Bill Items</h4>
                  <table className="preview-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingBill.items.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            {item.productName}
                            {item.attributeValue && (
                              <span className="item-variant"> ({item.attributeValue})</span>
                            )}
                          </td>
                          <td>{item.quantity}</td>
                          <td>Rs {parseFloat(item.unitPrice).toFixed(2)}</td>
                          <td>Rs {parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="preview-section">
                  <h4>Bill Summary</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Subtotal:</span>
                      <span>Rs {parseFloat(viewingBill.subtotal).toFixed(2)}</span>
                    </div>
                    {parseFloat(viewingBill.totalGST) > 0 && (
                      <>
                        <div className="summary-item">
                          <span>CGST:</span>
                          <span>Rs {parseFloat(viewingBill.cgst).toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                          <span>SGST:</span>
                          <span>Rs {parseFloat(viewingBill.sgst).toFixed(2)}</span>
                        </div>
                        <div className="summary-item">
                          <span>Total GST:</span>
                          <span>Rs {parseFloat(viewingBill.totalGST).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="summary-item grand-total-item">
                      <span>Grand Total:</span>
                      <span>Rs {parseFloat(viewingBill.grandTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-download" onClick={() => handleDownloadBill(viewingBill)}>
                <i className="bi bi-download me-2"></i>
                Download PDF
              </button>
              <button
                className={`btn-modal-toggle ${viewingBill.isActive === 1 ? 'btn-disable' : 'btn-enable'}`}
                onClick={() => {
                  handleToggleBillStatus(viewingBill.id, viewingBill.isActive);
                  setShowBillModal(false);
                }}
              >
                <i className={`bi ${viewingBill.isActive === 1 ? 'bi-x-circle me-2' : 'bi-check-circle me-2'}`}></i>
                {viewingBill.isActive === 1 ? 'Disable Bill' : 'Enable Bill'}
              </button>
              <button className="btn-modal-close" onClick={() => setShowBillModal(false)}>
                Close
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

export default BillingReport;