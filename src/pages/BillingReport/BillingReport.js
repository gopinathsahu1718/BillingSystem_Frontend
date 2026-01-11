import React, { useState, useEffect } from "react";
import './BillingReport.css';
import { 
  FaSearch, 
  FaEye,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";

const BillingReport = () => {
  // Mock Data for UI Visualization
  const [bills, setBills] = useState([
    {
      id: 1,
      billNumber: "INV2401-0001",
      customerName: "John Doe",
      customerContact: "9876543210",
      paymentMode: "cash",
      grandTotal: 43096.82,
      totalGST: 6497.82,
      isActive: true,
      createdAt: "2024-01-15T14:30:00",
    },
    {
      id: 2,
      billNumber: "INV2401-0002",
      customerName: "Sarah Smith",
      customerContact: "9898989898",
      paymentMode: "upi",
      grandTotal: 1250.00,
      totalGST: 190.68,
      isActive: true,
      createdAt: "2024-01-15T15:45:00",
    },
    {
      id: 3,
      billNumber: "INV2401-0003",
      customerName: "Tech Corp Ltd",
      customerContact: "9123456780",
      paymentMode: "netbanking",
      grandTotal: 156000.00,
      totalGST: 23796.61,
      isActive: false,
      createdAt: "2024-01-16T09:15:00",
    },
    {
      id: 4,
      billNumber: "INV2401-0004",
      customerName: "Alice Wonderland",
      customerContact: "8887776665",
      paymentMode: "card",
      grandTotal: 5499.00,
      totalGST: 838.83,
      isActive: true,
      createdAt: "2024-01-16T11:20:00",
    },
    {
      id: 5,
      billNumber: "INV2401-0005",
      customerName: "Bob Builder",
      customerContact: "9988776655",
      paymentMode: "cash",
      grandTotal: 250.00,
      totalGST: 0.00,
      isActive: true,
      createdAt: "2024-01-16T12:00:00",
    },
    {
      id: 6,
      billNumber: "INV2401-0006",
      customerName: "xyz",
      customerContact: "9988774411",
      paymentMode: "cash",
      grandTotal: 250.00,
      totalGST: 0.00,
      isActive: true,
      createdAt: "2024-01-16T12:00:00",
    },
  ]);

  const [filters, setFilters] = useState({
    search: "",
    paymentMode: "",
    isActive: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, billId: null });

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

  const handleActionMenuClick = (billId, e) => {
    e.stopPropagation();
    setOpenActionMenu(openActionMenu === billId ? null : billId);
  };

  const handleDelete = (billId) => {
    setDeleteConfirm({ isOpen: true, billId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.billId) {
      setBills(bills.filter(bill => bill.id !== deleteConfirm.billId));
      setOpenActionMenu(null);
      setCurrentPage(1);
      setDeleteConfirm({ isOpen: false, billId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, billId: null });
  };

  const handleEdit = (billId) => {
    alert(`View Details for bill ${billId}`);
    setOpenActionMenu(null);
  };

  const handleDownload = (billId) => {
    alert(`Downloading bill ${billId}`);
    setOpenActionMenu(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionMenu(null);
    };

    if (openActionMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openActionMenu]);

  return (
    <div className="billing-report-container">
      {/* Header Section */}
      <div className="billing-report-header">
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
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>
          
          {/* Reset Button */}
          <button className="billing-report-reset-btn" onClick={handleResetFilters}>Reset Filter</button>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="billing-report-table-wrapper">
        <div className="billing-report-table-container">
          <table className="billing-report-billing-table">
            <thead>
              <tr>
                <th>Bill Details</th>
                <th>Customer Info</th>
                <th>Payment</th>
                <th>Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBills.map((bill) => (
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
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    <button 
                      className="billing-report-action-btn" 
                      title="View Details"
                      onClick={(e) => handleActionMenuClick(bill.id, e)}
                    >
                      <FaEye size={16} />
                    </button>
                    {openActionMenu === bill.id && (
                      <div className="billing-report-action-menu">
                        <button className="billing-report-action-menu-item" onClick={() => handleEdit(bill.id)}>
                          View Details
                        </button>
                        <button className="billing-report-action-menu-item" onClick={() => handleDownload(bill.id)}>
                          Download
                        </button>
                        <button className="billing-report-action-menu-item billing-report-delete" onClick={() => handleDelete(bill.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pageno */}
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
    </div>
  );
};

// --- Sub-components for Cleaner Code ---

const PaymentBadge = ({ mode }) => {
  const badgeClasses = {
    cash: "billing-report-badge-cash",
    card: "billing-report-badge-card",
    upi: "billing-report-badge-upi",
    netbanking: "billing-report-badge-netbanking",
    default: "billing-report-badge-cash"
  };

  const badgeClass = badgeClasses[mode] || badgeClasses.default;

  return (
    <span className={`billing-report-payment-badge ${badgeClass}`}>
      {mode}
    </span>
  );
};

export default BillingReport;