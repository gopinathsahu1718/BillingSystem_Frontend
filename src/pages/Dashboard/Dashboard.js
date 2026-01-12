import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './Dashboard.css';

// You'll need to import your auth context
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  // If you have authentication, uncomment this
  const { token } = useAuth();
  
  // For now, we'll assume token is available or handle it differently
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalBills: { count: 0, amount: '0.00' },
      todayBills: { count: 0, amount: '0.00' },
      weekBills: { count: 0, amount: '0.00' },
      monthBills: { count: 0, amount: '0.00' }
    },
    billsByCategory: [],
    billsBySubCategory: [],
    lastFiveBills: [],
    topProducts: [],
    topAttributes: [],
    paymentModeStats: [],
    revenueTrend: [],
    gstSummary: {
      totalSubtotal: '0.00',
      totalCGST: '0.00',
      totalSGST: '0.00',
      totalGST: '0.00'
    },
    lowStockProducts: [],
    lowStockAttributes: []
  });

  // Chart colors
  const COLORS = ['#4f46e5', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the URL with your actual API endpoint
      const response = await fetch('http://13.232.200.172/api/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // If you need authentication, add token here
          'Authorization': `Bearer ${token}`
        },
        // credentials: 'include' // For session-based auth
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setDashboardData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh handler
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get stock status class
  const getStockStatusClass = (stock) => {
    if (stock === 0) return 'stock-out';
    if (stock < 5) return 'stock-critical';
    if (stock < 10) return 'stock-low';
    return 'stock-normal';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <div className="error-message">
            <i className="bi bi-exclamation-circle"></i>
            <span>{error}</span>
            <button className="retry-btn" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise"></i> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, billsByCategory, billsBySubCategory, lastFiveBills, topProducts, 
          topAttributes, paymentModeStats, revenueTrend, gstSummary, 
          lowStockProducts, lowStockAttributes } = dashboardData;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">
              <i className="bi bi-speedometer2"></i>
              Inventory Dashboard
            </h1>
            <p className="page-subtitle">Real-time analytics and insights</p>
          </div>
          <div className="header-stats">
            <button className="refresh-btn" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Today's Bills</div>
                <div className="stat-value">{overview.todayBills.count}</div>
              </div>
              <div className="stat-icon revenue-icon">
                <i className="bi bi-calendar-day"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-amount">{formatCurrency(overview.todayBills.amount)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">This Week</div>
                <div className="stat-value">{overview.weekBills.count}</div>
              </div>
              <div className="stat-icon registration-icon">
                <i className="bi bi-calendar-week"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-amount">{formatCurrency(overview.weekBills.amount)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">This Month</div>
                <div className="stat-value">{overview.monthBills.count}</div>
              </div>
              <div className="stat-icon courses-icon">
                <i className="bi bi-calendar-month"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-amount">{formatCurrency(overview.monthBills.amount)}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Bills</div>
                <div className="stat-value">{overview.totalBills.count}</div>
              </div>
              <div className="stat-icon rate-icon">
                <i className="bi bi-receipt"></i>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-amount">{formatCurrency(overview.totalBills.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* GST Summary */}
      <div className="gst-summary-section">
        <h2 className="section-title">
          <i className="bi bi-calculator"></i> GST Summary
        </h2>
        <div className="gst-cards-grid">
          <div className="gst-card">
            <div className="gst-label">Subtotal</div>
            <div className="gst-value">{formatCurrency(gstSummary.totalSubtotal)}</div>
          </div>
          <div className="gst-card">
            <div className="gst-label">CGST</div>
            <div className="gst-value">{formatCurrency(gstSummary.totalCGST)}</div>
          </div>
          <div className="gst-card">
            <div className="gst-label">SGST</div>
            <div className="gst-value">{formatCurrency(gstSummary.totalSGST)}</div>
          </div>
          <div className="gst-card gst-total">
            <div className="gst-label">Total GST</div>
            <div className="gst-value">{formatCurrency(gstSummary.totalGST)}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">Revenue Trend (Last 7 Days)</h5>
              <p className="chart-subtitle">Daily revenue and bill count</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                  }}
                  formatter={(value, name) => {
                    if (name === 'grandTotal' || name === 'subtotal' || name === 'totalGST') {
                      return [formatCurrency(value), name === 'grandTotal' ? 'Grand Total' : name === 'subtotal' ? 'Subtotal' : 'GST'];
                    }
                    return [value, 'Bills'];
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="grandTotal" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  dot={{ fill: '#4f46e5', r: 4 }}
                  name="Grand Total"
                />
                <Line 
                  type="monotone" 
                  dataKey="billCount" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Bill Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Mode Distribution */}
        <div className="chart-card pie-chart">
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">Payment Methods</h5>
              <p className="chart-subtitle">Distribution by payment mode</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentModeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ paymentMode, count }) => `${paymentMode}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="paymentMode"
                >
                  {paymentModeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `Count: ${value}, Amount: ${formatCurrency(props.payload.total)}`,
                    props.payload.paymentMode
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-legend">
            {paymentModeStats.map((item, index) => (
              <div key={index} className="pie-legend-item">
                <div className="pie-legend-left">
                  <div
                    className="pie-legend-color"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span>{item.paymentMode}</span>
                </div>
                <span className="pie-legend-value">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Section */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-header-text">
            <h5 className="chart-title">
              <i className="bi bi-star-fill"></i> Top 10 Products
            </h5>
            <p className="chart-subtitle">Best performing products by quantity sold</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Bills</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={index}>
                    <td>
                      <span className="rank-badge">{index + 1}</span>
                    </td>
                    <td>
                      <div className="product-info">
                        <span className="product-name">{product.displayName}</span>
                        <span className="product-sku">SKU: {product.productSKU}</span>
                      </div>
                    </td>
                    <td><strong>{product.totalQuantitySold}</strong></td>
                    <td>{product.billCount}</td>
                    <td className="amount">{formatCurrency(product.totalRevenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Attributes Section */}
      {topAttributes.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">
                <i className="bi bi-tags-fill"></i> Top 10 Product Variants
              </h5>
              <p className="chart-subtitle">Best performing product attributes</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Variant</th>
                  <th>Qty Sold</th>
                  <th>Bills</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topAttributes.map((attr, index) => (
                  <tr key={index}>
                    <td>
                      <span className="rank-badge">{index + 1}</span>
                    </td>
                    <td>
                      <div className="product-info">
                        <span className="product-name">{attr.displayName}</span>
                        <span className="product-sku">SKU: {attr.productSKU}</span>
                      </div>
                    </td>
                    <td><strong>{attr.totalQuantitySold}</strong></td>
                    <td>{attr.billCount}</td>
                    <td className="amount">{formatCurrency(attr.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales by Category */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-header-text">
            <h5 className="chart-title">
              <i className="bi bi-diagram-3-fill"></i> Sales by Category
            </h5>
            <p className="chart-subtitle">Category-wise sales breakdown</p>
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={Math.max(250, billsByCategory.length * 60)}>
            <BarChart data={billsByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis 
                type="category" 
                dataKey="categoryName" 
                stroke="#94a3b8"
                width={150}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'totalAmount') return [formatCurrency(value), 'Total Amount'];
                  return [value, name];
                }}
              />
              <Bar dataKey="billCount" fill="#4f46e5" name="Bill Count" radius={[0, 8, 8, 0]} />
              <Bar dataKey="totalQuantity" fill="#10b981" name="Quantity" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by SubCategory */}
      {billsBySubCategory.length > 0 && (
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-header-text">
              <h5 className="chart-title">
                <i className="bi bi-diagram-2-fill"></i> Sales by Sub-Category
              </h5>
              <p className="chart-subtitle">Sub-category wise sales breakdown</p>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sub-Category</th>
                  <th>Category</th>
                  <th>Bills</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {billsBySubCategory.map((sub, index) => (
                  <tr key={index}>
                    <td><strong>{sub.subCategoryName}</strong></td>
                    <td>{sub.categoryName}</td>
                    <td>{sub.billCount}</td>
                    <td>{sub.totalQuantity}</td>
                    <td className="amount">{formatCurrency(sub.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Bills */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-header-text">
            <h5 className="chart-title">
              <i className="bi bi-clock-history"></i> Recent Bills
            </h5>
            <p className="chart-subtitle">Last 5 bills</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {lastFiveBills.length > 0 ? (
                lastFiveBills.map((bill, index) => (
                  <tr key={index}>
                    <td><strong>{bill.billNumber}</strong></td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{bill.customerName}</span>
                        <span className="customer-contact">{bill.customerContact}</span>
                      </div>
                    </td>
                    <td>{bill.itemCount} items</td>
                    <td>
                      <span className={`payment-badge payment-${bill.paymentMode}`}>
                        {bill.paymentMode}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(bill.grandTotal)}</td>
                    <td className="date-cell">{formatDate(bill.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No recent bills</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {(lowStockProducts.length > 0 || lowStockAttributes.length > 0) && (
        <div className="alert-section">
          <h2 className="section-title alert-title">
            <i className="bi bi-exclamation-triangle-fill"></i> Low Stock Alerts
          </h2>
          
          {lowStockProducts.length > 0 && (
            <div className="chart-card alert-card">
              <div className="chart-header">
                <div className="chart-header-text">
                  <h5 className="chart-title">Low Stock Products</h5>
                  <p className="chart-subtitle">Products with stock below 10 units</p>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Stock</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product, index) => (
                      <tr key={index}>
                        <td><strong>{product.name}</strong></td>
                        <td>{product.category?.name}</td>
                        <td>{product.sku}</td>
                        <td>
                          <span className={`stock-badge ${getStockStatusClass(product.stock)}`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="amount">{formatCurrency(product.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {lowStockAttributes.length > 0 && (
            <div className="chart-card alert-card">
              <div className="chart-header">
                <div className="chart-header-text">
                  <h5 className="chart-title">Low Stock Variants</h5>
                  <p className="chart-subtitle">Product variants with stock below 10 units</p>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Stock</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockAttributes.map((attr, index) => (
                      <tr key={index}>
                        <td>
                          <div className="product-info">
                            <span className="product-name">{attr.displayName}</span>
                          </div>
                        </td>
                        <td>{attr.category}</td>
                        <td>{attr.sku}</td>
                        <td>
                          <span className={`stock-badge ${getStockStatusClass(attr.stock)}`}>
                            {attr.stock} units
                          </span>
                        </td>
                        <td className="amount">{formatCurrency(attr.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;