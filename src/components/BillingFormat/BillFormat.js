import React from 'react';
import './BillFormat.css';

const BillFormat = ({ billData }) => {
  // Dummy data structure - replace with actual cart data
  const defaultData = {
    billNo: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    customerName: '',
    address: '',
    contactNo: '',
    paymentMode: '',
    items: [
      { id: 1, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 2, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 3, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 4, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 5, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 6, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 7, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
      { id: 8, name: '', hsn: '', qty: '', rate: '', taxable: 0.00, cgst: '-', sgst: '-', total: 0.00 },
    ],
    grandTotal: 0.00,
    rupeesInWords: '',
    bankDetails: {
      bank: 'SBI, PKD',
      accountNo: '11305057961',
      ifsc: 'SBIN0000151',
      branch: 'Paralakhemundi'
    }
  };

  const data = billData || defaultData;

  return (
    <div className="bill-container">
      {/* Header Section */}
      <div className="bill-header">
        <div className="header-top-border"></div>
        <div className="header-content">
          <div className="logo-left">
            <img src="lord_ganesha.jpeg" alt="Ganesh" className="ganesh-logo" />
          </div>
          
          <div className="header-center">
            <h1 className="company-name">SRI GANESH</h1>
            <p className="company-subtitle">School, College Books, Office Stationaries & Order Suppliers</p>
            <p className="company-address">Girls High School Road, Paralakhemundi</p>
            
            <div className="enterprise-section">
              <h2 className="enterprise-name">SWASTIK ENTERPRISE</h2>
              <div className="bill-badge">BILL OF SUPPLY</div>
            </div>
          </div>
          
          <div className="logo-right">
            <img src="godess_laxmi.jpeg" alt="Goddess" className="goddess-logo" />
          </div>
        </div>
      </div>

      {/* GST and Bill Info */}
      <div className="bill-info-row">
        <div className="gst-info">
          <span className="label">GST No:</span> 21AHBPP7353B1ZT
        </div>
        <div className="bill-details">
          <div className="bill-no">
            <span className="label">Bill No:</span>
            <div className="input-field"></div>
          </div>
          <div className="bill-date">
            <span className="label">Date:</span>
            <div className="input-field">{data.date}</div>
            <span className="calendar-icon">📅</span>
          </div>
          <div className="bill-time">
            <span className="label">Time:</span>
            <div className="input-field">{data.time}</div>
            <span className="clock-icon">🕐</span>
          </div>
        </div>
        <div className="mobile-info">
          <span className="label">Mobile:</span> 9337966306
        </div>
      </div>

      {/* Customer Details */}
      <div className="customer-section">
        <div className="customer-field">
          <span className="field-icon">👤</span>
          <span className="field-label">Customer Name:</span>
          <div className="field-input"></div>
        </div>
        
        <div className="customer-field">
          <span className="field-icon">📍</span>
          <span className="field-label">Address:</span>
          <div className="field-input"></div>
        </div>
        
        <div className="customer-field">
          <span className="field-icon">📞</span>
          <span className="field-label">Contact No:</span>
          <div className="field-input"></div>
        </div>
        
        <div className="customer-field">
          <span className="field-icon">💳</span>
          <span className="field-label">Payment Mode:</span>
          <div className="field-input"></div>
        </div>
      </div>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item Name</th>
            <th>HSN</th>
            <th>Qty</th>
            <th>Rate (₹)</th>
            <th>Taxable (₹)</th>
            <th className="tax-column">CGST (₹)</th>
            <th className="tax-column">SGST (₹)</th>
            <th>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.hsn}</td>
              <td>{item.qty}</td>
              <td>{item.rate}</td>
              <td>{item.taxable.toFixed(2)}</td>
              <td className="tax-column">{item.cgst}</td>
              <td className="tax-column">{item.sgst}</td>
              <td>{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Grand Total */}
      <div className="grand-total-section">
        <span className="grand-total-label">Grand Total:</span>
        <div className="grand-total-amount">₹ {data.grandTotal.toFixed(2)}</div>
      </div>

      {/* Rupees in Words */}
      <div className="rupees-words">
        <span className="words-label">Rupees (in words):</span>
        <div className="words-line"></div>
      </div>

      {/* Payment Details */}
      <div className="payment-details-section">
        <div className="payment-header">
          <span className="payment-icon">💳</span>
          <span className="payment-label">Payment Details</span>
        </div>
        <div className="bank-details">
          <div className="bank-row">
            <span className="bank-label">Bank:</span>
            <span className="bank-value">{data.bankDetails.bank}</span>
          </div>
          <div className="bank-row">
            <span className="bank-label">Branch:</span>
            <span className="bank-value">{data.bankDetails.branch}</span>
          </div>
          <div className="bank-row">
            <span className="bank-label">A/C No:</span>
            <span className="bank-value">{data.bankDetails.accountNo}</span>
          </div>
          <div className="bank-row">
            <span className="bank-label">IFSC Code:</span>
            <span className="bank-value">{data.bankDetails.ifsc}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bill-footer">
        <div className="footer-line">For SWASTIK ENTERPRISE</div>
        <div className="signature-section">
          <div className="signature-line">Authorized Signatory</div>
        </div>
        <div className="footer-note">
          <span className="warning-icon">⚠️</span>
          <span className="note-text">Composition Dealer not eligible for Collection on supply of services.</span>
        </div>
      </div>
    </div>
  );
};

export default BillFormat;