import React, { useRef } from 'react';
import './BillPage.css';

const BillPage = () => {
  const billRef = useRef();

  // Dummy data - replace with API data later
  const billData = {
    billNo: 'BILL-2025-001',
    date: '29-12-2025',
    time: '23:46',
    gstNo: '21AHBPP7353B1ZT',
    mobile: '9337966306',
    customerName: 'John Doe',
    address: 'Main Road, Paralakhemundi, Odisha - 761200',
    contactNo: '9876543210',
    paymentMode: 'Cash',
    items: [
      {
        id: 1,
        name: 'Mathematics Textbook Class 10 CBSE',
        hsn: '49011010',
        qty: 2,
        rate: 350.00,
        discount: 0,
        taxable: 700.00,
        cgstRate: 9,
        cgst: 63.00,
        sgstRate: 9,
        sgst: 63.00,
        total: 826.00
      },
      {
        id: 2,
        name: 'Premium Geometry Box Set',
        hsn: '90171000',
        qty: 1,
        rate: 150.00,
        discount: 0,
        taxable: 150.00,
        cgstRate: 9,
        cgst: 13.50,
        sgstRate: 9,
        sgst: 13.50,
        total: 177.00
      },
      {
        id: 3,
        name: 'Register Copy 200 Pages',
        hsn: '48201030',
        qty: 5,
        rate: 45.00,
        discount: 0,
        taxable: 225.00,
        cgstRate: 9,
        cgst: 20.25,
        sgstRate: 9,
        sgst: 20.25,
        total: 265.50
      },
      {
        id: 4,
        name: 'Blue Ball Pen Pack of 10',
        hsn: '96091010',
        qty: 3,
        rate: 50.00,
        discount: 0,
        taxable: 150.00,
        cgstRate: 9,
        cgst: 13.50,
        sgstRate: 9,
        sgst: 13.50,
        total: 177.00
      },
      {
        id: 5,
        name: 'Drawing Book A4 Size',
        hsn: '48201030',
        qty: 2,
        rate: 80.00,
        discount: 0,
        taxable: 160.00,
        cgstRate: 9,
        cgst: 14.40,
        sgstRate: 9,
        sgst: 14.40,
        total: 188.80
      }
    ],
    grandTotal: 1634.30,
    rupeesInWords: 'One Thousand Six Hundred Thirty Four Rupees and Thirty Paise Only',
    bankDetails: {
      bank: 'SBI, PKD',
      accountNo: '11305057961',
      ifsc: 'SBIN0000151',
      branch: 'Paralakhemundi'
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    // Import dynamically only when needed
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const element = billRef.current;
    
    // Create canvas with high quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123 // A4 height in pixels at 96 DPI
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Bill-${billData.billNo}.pdf`);
  };

  return (
    <div className="bill-page-wrapper">
      {/* Action Buttons - Hidden during print */}
      <div className="action-buttons no-print">
        <button onClick={handlePrint} className="btn-print">
          🖨️ Print Bill
        </button>
        <button onClick={handleDownload} className="btn-download">
          📥 Download PDF
        </button>
      </div>

      {/* Bill Container - Fixed A4 Size */}
      <div className="bill-page-container">
        <div ref={billRef} className="bill-content">
          
          {/* Header with decorative border */}
          <div className="header-border"></div>

          {/* Header Section */}
          <div className="bill-header">
            <div className="header-layout">
              <div className="logo-section logo-left">
                <img src="lord_ganesha.jpeg" alt="Ganesh" className="ganesh-logo" />
              </div>

              <div className="header-center">
                <h1 className="company-title">SRI GANESH</h1>
                <p className="company-desc">School, College Books, Office Stationaries & Order Suppliers</p>
                <p className="company-location">Girls High School Road, Paralakhemundi</p>
                
                <div className="enterprise-block">
                  <h2 className="enterprise-title">SWASTIK ENTERPRISE</h2>
                  <div className="bill-type-badge">TAX INVOICE</div>
                </div>
              </div>

              <div className="logo-section logo-right">
                <img src="godess_laxmi.jpeg" alt="Goddess" className="goddess-logo" />
              </div>
            </div>
          </div>

          {/* Bill Information Row */}
          <div className="info-section">
            <div className="info-boxes">
              <div className="info-box">
                <div>
                    <span className="info-label">GST No:</span>
                    <span className="info-value">{billData.gstNo}</span>
                </div>
                <div>
                    <span className="info-label">Mobile:</span>
                    <span className="info-value">{billData.mobile}</span>
                </div>
              </div>
            </div>
            <div className="bill-meta-row">
              <div className="meta-item">
                <span className="info-label">Bill No:</span>
                <span className="meta-value">{billData.billNo}</span>
              </div>
              <div className="meta-item">
                <span className="info-label">Date:</span>
                <span className="meta-value">{billData.date}</span>
                {/* <span className="icon">📅</span> */}
              </div>
              <div className="meta-item">
                <span className="info-label">Time:</span>
                <span className="meta-value">{billData.time}</span>
                {/* <span className="icon">🕐</span> */}
              </div>
            </div>
          </div>

          {/* Customer Details Section */}
          <div className="customer-details">
            <div className="customer-row">
              <span className="customer-icon">👤</span>
              <span className="customer-label">Customer Name:</span>
              <span className="customer-value">{billData.customerName}</span>
            </div>
            <div className="customer-row">
              <span className="customer-icon">📍</span>
              <span className="customer-label">Address:</span>
              <span className="customer-value">{billData.address}</span>
            </div>
            <div className="customer-row">
              <span className="customer-icon">📞</span>
              <span className="customer-label">Contact No:</span>
              <span className="customer-value">{billData.contactNo}</span>
            </div>
            <div className="customer-row">
              <span className="customer-icon">💳</span>
              <span className="customer-label">Payment Mode:</span>
              <span className="customer-value">{billData.paymentMode}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-serial">#</th>
                <th className="col-item">Item Name</th>
                <th className="col-hsn">HSN</th>
                <th className="col-qty">Qty</th>
                <th className="col-rate">Rate (₹)</th>
                <th className="col-discount">Discount (₹)</th>
                <th className="col-taxable">Taxable (₹)</th>
                <th className="col-tax">CGST<br/><span className="tax-percent">(%)</span></th>
                <th className="col-tax">SGST<br/><span className="tax-percent">(%)</span></th>
                <th className="col-total">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {billData.items.map((item) => (
                <tr key={item.id}>
                  <td className="text-center">{item.id}</td>
                  <td className="text-left">{item.name}</td>
                  <td className="text-center">{item.hsn}</td>
                  <td className="text-center">{item.qty}</td>
                  <td className="text-right">{item.rate.toFixed(2)}</td>
                  <td className="text-right">{item.discount.toFixed(2)}</td>
                  <td className="text-right">{item.taxable.toFixed(2)}</td>
                  <td className="text-right">
                    {item.cgst.toFixed(2)}
                    <br/>
                    <span className="tax-rate">({item.cgstRate}%)</span>
                  </td>
                  <td className="text-right">
                    {item.sgst.toFixed(2)}
                    <br/>
                    <span className="tax-rate">({item.sgstRate}%)</span>
                  </td>
                  <td className="text-right">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total */}
          <div className="grand-total-row">
            <span className="total-label">Grand Total:</span>
            <div className="total-amount">₹ {billData.grandTotal.toFixed(2)}</div>
          </div>

          {/* Rupees in Words */}
          <div className="amount-words">
            <span className="words-label">Rupees (in words):</span>
            <span className="words-value">{billData.rupeesInWords}</span>
          </div>

          {/* Payment Details */}
          <div className="payment-section">
            <div className="payment-title">
              <span className="payment-icon">💳</span>
              <span>Payment Details</span>
            </div>
            <div className="bank-info">
              <div className="bank-item">
                <span className="bank-label">Bank:</span>
                <span className="bank-value">{billData.bankDetails.bank}</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">A/C No:</span>
                <span className="bank-value">{billData.bankDetails.accountNo}</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">Branch:</span>
                <span className="bank-value">{billData.bankDetails.branch}</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">IFSC Code:</span>
                <span className="bank-value">{billData.bankDetails.ifsc}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bill-footer">
            <div className="footer-company">For SWASTIK ENTERPRISE</div>
            <div className="signature-area">
              <div className="signature-line">Authorized Signatory</div>
            </div>
            <div className="footer-note">
              <span className="note-icon">⚠️</span>
              <span className="note-text">Composition Dealer not eligible for Collection on supply of services.</span>
            </div>
          </div>
          <div className="header-border"></div>
        </div>
      </div>
    </div>
  );
};

export default BillPage;