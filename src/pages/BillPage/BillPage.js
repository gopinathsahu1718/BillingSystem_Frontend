import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BillPage.css';

// Function to convert number to words
const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  const convertHundreds = (n) => {
    let result = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundred > 0) {
      result += ones[hundred] + ' Hundred';
    }

    if (remainder > 0) {
      if (hundred > 0) result += ' ';
      if (remainder < 10) {
        result += ones[remainder];
      } else if (remainder < 20) {
        result += teens[remainder - 10];
      } else {
        const ten = Math.floor(remainder / 10);
        const one = remainder % 10;
        result += tens[ten];
        if (one > 0) {
          result += ' ' + ones[one];
        }
      }
    }

    return result;
  };

  if (num < 0) return 'Negative ' + numberToWords(-num);

  let integerPart = Math.floor(num);
  let decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0) integerPart = 0;

  let words = '';
  let scaleIndex = 0;

  while (integerPart > 0) {
    if (integerPart % 1000 !== 0) {
      words = convertHundreds(integerPart % 1000) + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (words ? ' ' + words : '');
    }
    integerPart = Math.floor(integerPart / 1000);
    scaleIndex++;
  }

  let result = words.trim();

  if (decimalPart > 0) {
    result += ' and ' + decimalPart + ' Paisa';
  }

  return result;
};

const BillPage = () => {
  const billRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const publicUrl = process.env.PUBLIC_URL || '';
  const downloadLockRef = useRef(false);

  // Get bill data from location state
  const billData = location.state?.billData || {
    billNo: 'BILL-2025-001',
    date: new Date().toLocaleDateString('en-IN'),
    time: new Date().toLocaleTimeString('en-IN'),
    gstNo: '21AHBPP7353B1ZT',
    mobile: '',
    customerName: '',
    address: '',
    contactNo: '',
    paymentMode: 'Cash',
    items: [],
    cart: [],
    summary: { totalTax: 0, totalDiscount: 0 },
    grandTotal: 0,
    rupeesInWords: '',
    bankDetails: {
      bank: 'SBI, PKD',
      accountNo: '11305057961',
      ifsc: 'SBIN0000151',
      branch: 'Paralakhemundi'
    }
  };

  const autoDownload = location.state?.autoDownload || false;

  // Auto-generate date and time if not provided, and map mobile to contactNo
  const grandTotal = billData.summary?.total || billData.grandTotal || 0;
  const rupeesInWords = billData.rupeesInWords || (grandTotal > 0 ? numberToWords(grandTotal) + ' Rupees Only' : '');

  const finalBillData = {
    ...billData,
    date: billData.date || new Date().toLocaleDateString('en-IN'),
    time: billData.time || new Date().toLocaleTimeString('en-IN'),
    contactNo: billData.contactNo || billData.mobileNumber || billData.mobile || '',
    mobile: billData.mobile || billData.mobileNumber || '',
    address: billData.address || billData.customerAddress || '',
    rupeesInWords: rupeesInWords
  };

  const displayAddress = finalBillData.address && finalBillData.address.trim() !== ''
    ? finalBillData.address
    : 'N/A';

  // Transform cart items to bill items format
  const transformCartItems = (cartItems) => {
    if (!Array.isArray(cartItems)) return [];
    return cartItems.map((item, index) => ({
      id: index + 1,
      name: item.name || '',
      hsn: item.hsn || '',
      qty: item.quantity || item.qty || 0,
      rate: parseFloat(item.price || item.rate || 0),
      discount: parseFloat(item.discount || 0),
      taxable: parseFloat(item.baseAmount || item.taxable || 0),
      cgst: parseFloat(item.cgst || 0),
      sgst: parseFloat(item.sgst || 0),
      cgstRate: item.gst ? item.gst / 2 : 9,
      sgstRate: item.gst ? item.gst / 2 : 9,
      total: parseFloat(
        (item.lineTotal || item.total || 0) - 
       ((item.lineTotal || item.total || 0) * (item.discount || 0)) / 100
      ),
      attributeName: item.attributeName || null
    }));
  };

  // Ensure bankDetails always exists
  const bankDetails = finalBillData.bankDetails || {
    bank: 'SBI, PKD',
    accountNo: '11305057961',
    ifsc: 'SBIN0000151',
    branch: 'Paralakhemundi'
  };

  // Ensure items is always an array
  const items = (finalBillData.items && Array.isArray(finalBillData.items)) 
    ? transformCartItems(finalBillData.items) 
    : (finalBillData.cart && Array.isArray(finalBillData.cart)) 
    ? transformCartItems(finalBillData.cart) 
    : [];

  // Auto-download PDF when autoDownload flag is true
  useEffect(() => {
    if (autoDownload && billRef.current) {
      // Wait for component to render completely
      setTimeout(() => {
        handleDownload();
      }, 1000);
    }
  }, [autoDownload]);

  const handleBackToBilling = () => {
    navigate('/billing-report');
  };

  const handlePrint = () => {
    // Set document title for print dialog suggestion
    const originalTitle = document.title;
    const customerName = finalBillData.customerName.replace(/\s+/g, '_') || 'Customer';
    const billNo = finalBillData.billNo || 'BILL';
    document.title = `${billNo}-${customerName}`;
    
    // Restore title after print dialog closes
    window.addEventListener('afterprint', () => {
      document.title = originalTitle;
    }, { once: true });
    
    // Print the page
    window.print();
  };

  const handleDownload = async () => {
  if (downloadLockRef.current) {
    return;
  }
  downloadLockRef.current = true;
  try {
    // Import dynamically only when needed
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const element = billRef.current;
    
    // Get the actual dimensions of the bill content
    const billWidth = element.offsetWidth;
    const billHeight = element.offsetHeight;
    
    // Create canvas with high quality - FIX: Remove windowWidth/windowHeight
    const canvas = await html2canvas(element, {
      scale: 2,              // High quality
      useCORS: true,         // Allow loading images
      logging: false,        // Disable console logs
      backgroundColor: '#ffffff', // White background
      width: billWidth,      // Use actual element width
      height: billHeight     // Use actual element height
      // REMOVED: windowWidth and windowHeight - these were causing the squeeze!
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions to fit A4 properly
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Generate filename with customer name
    const customerName = finalBillData.customerName.replace(/\s+/g, '_') || 'Customer';
    const billNo = finalBillData.billNo || 'BILL';
    const fileName = `${billNo}-${customerName}.pdf`;
    
    pdf.save(fileName);

    // If auto-download, navigate back to reports after download
    if (autoDownload) {
      setTimeout(() => {
        navigate('/billing-report');
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to download PDF:', error);
    alert('Failed to download PDF. Please try again.');
  } finally {
    downloadLockRef.current = false;
  }
};

  return (
    <div className="bill-page-wrapper">
      {/* Action Buttons - Hidden during print */}
      <div className="action-buttons no-print">
        <button onClick={handleBackToBilling} className="btn-back">
          ← Back to {autoDownload ? 'Reports' : 'Billing'}
        </button>
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
                  <img src={`${publicUrl}/lord_ganesha.jpeg`} alt="Ganesh" className="ganesh-logo" crossOrigin="anonymous" />
              </div>

              <div className="header-center">
                <h1 className="company-title">SRI GANESH</h1>
                <p className="company-desc">School, College Books, Office Stationaries & Order Suppliers</p>
                <p className="company-location">Girls High School Road, Paralakhemundi</p>
                
                <div className="enterprise-block">
                  <h2 className="enterprise-title">
                    {finalBillData.store === 'swasthik' ? 'SWASTIK ENTERPRISE' : 'LAKSHMI BOOKSTORE'}
                  </h2>
                  <div className="bill-type-badge">TAX INVOICE</div>
                </div>
              </div>

              <div className="logo-section logo-right">
                  <img src={`${publicUrl}/godess_laxmi.jpeg`} alt="Goddess" className="goddess-logo" crossOrigin="anonymous" />
              </div>
            </div>
          </div>

          {/* Bill Information Row */}
          <div className="info-section">
            <div className="info-boxes">
              <div className="info-box">
                <div>
                    <span className="info-label">GST No:</span>
                    <span className="info-value">21AAACC1206D2ZR</span>
                </div>
                <div>
                    <span className="info-label">Mobile:</span>
                    <span className="info-value">9692405306</span>
                </div>
              </div>
            </div>
            <div className="bill-meta-row">
              <div className="meta-item">
                <span className="info-label">Bill No:</span>
                <span className="meta-value">{finalBillData.billNo}</span>
              </div>
              <div className="meta-item">
                <span className="info-label">Date:</span>
                <span className="meta-value">{finalBillData.date}</span>
              </div>
              <div className="meta-item">
                <span className="info-label">Time:</span>
                <span className="meta-value">{finalBillData.time}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Section */}
          <div className="customer-details">
            <div className="customer-row">
              <span className="customer-icon">👤</span>
              <span className="customer-label">Customer Name:</span>
              <span className="customer-value">{finalBillData.customerName}</span>
            </div>
            <div className="customer-row">
              <span className="customer-icon">📍</span>
              <span className="customer-label">Address:</span>
              <span className="customer-value address-value">
                  {displayAddress}
                </span>
            </div>
            <div className="customer-row">
              <span className="customer-icon">📞</span>
              <span className="customer-label">Contact No:</span>
              <span className="customer-value">{finalBillData.contactNo}</span>
            </div>
            <div className="customer-row">
              <span className="customer-icon">💳</span>
              <span className="customer-label">Payment Mode:</span>
              <span className="customer-value">{finalBillData.paymentMode}</span>
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
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center">{item.id}</td>
                    <td className="text-left">
                      {item.name}
                      {item.attributeName && (
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                          {item.attributeName}
                        </div>
                      )}
                    </td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center" style={{padding: '20px', color: '#999'}}>
                    No items in this bill
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Grand Total */}
          <div className="grand-total-row">
            <span className="total-label">Grand Total:</span>
            <div className="total-amount">₹ {((finalBillData.summary?.total || finalBillData.grandTotal) || 0).toFixed(2)}</div>
          </div>

          {/* Rupees in Words */}
          <div className="amount-words">
            <span className="words-label">Rupees (in words):</span>
            <span className="words-value">{finalBillData.rupeesInWords || ''}</span>
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
                <span className="bank-value">{bankDetails.bank}</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">A/C No:</span>
                <span className="bank-value">{bankDetails.accountNo}</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">Branch:</span>
                <span className="bank-value">{bankDetails.branch}</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">IFSC Code:</span>
                <span className="bank-value">{bankDetails.ifsc}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bill-footer">
            <div className="footer-company">{finalBillData.store === 'swastik' ? 'SWASTIK ENTERPRISE' : 'LAKSHMI BOOKSTORE'}</div>
            <div className="signature-area">
              <div className="signature-line">Authorized Signatory</div>
            </div>
            {/* <div className="footer-note">
              <span className="note-icon">⚠️</span>
              <span className="note-text">Composition Dealer not eligible for Collection on supply of services.</span>
            </div> */}
          </div>
          <div className="header-border"></div>
        </div>
      </div>
    </div>
  );
};

export default BillPage;