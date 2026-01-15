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
    store: 'laxmi',
    bankDetails: {
      bank: 'SBI, PKD',
      accountNo: '11305057961',
      ifsc: 'SBIN0000151',
      branch: 'Paralakhemundi'
    }
  };

  const autoDownload = location.state?.autoDownload || false;

  // Determine if this is Laxmi Bookstore (no GST)
  const isLaxmiBookstore = billData.store === 'laxmi';

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

  const displayAddress = finalBillData.address && finalBillData.address.trim() !== '' && finalBillData.address !== 'N/A'
    ? finalBillData.address
    : 'N/A';

  // Transform cart items to bill items format with proper calculations
  const transformCartItems = (cartItems) => {
    if (!Array.isArray(cartItems)) return [];
    return cartItems.map((item, index) => {
      const rate = parseFloat(item.price || item.rate || 0);
      const qty = parseInt(item.quantity || item.qty || 0);
      const actualPrice = parseFloat(item.actualPrice || 0);
      
      // Calculate discount amount per unit
      const discountPerUnit = actualPrice > rate ? actualPrice - rate : 0;
      const totalDiscountAmount = discountPerUnit * qty;
      
      // Base amount (subtotal without GST)
      const baseAmount = rate * qty;
      
      return {
        id: index + 1,
        name: item.name || '',
        hsn: item.hsn || '',
        qty: qty,
        rate: rate,
        actualPrice: actualPrice,
        discount: totalDiscountAmount,
        taxable: baseAmount,
        cgst: parseFloat(item.cgst || 0),
        sgst: parseFloat(item.sgst || 0),
        cgstRate: item.gst ? item.gst / 2 : 9,
        sgstRate: item.gst ? item.gst / 2 : 9,
        total: parseFloat(item.lineTotal || item.total || baseAmount),
        attributeName: item.attributeName || null
      };
    });
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

  const parseNumber = (value) => {
    const numeric = parseFloat(value);
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const getItemDiscountAmount = (item) => {
    const rate = parseNumber(item.rate ?? item.price);
    const actualPrice = parseNumber(
      item.actualPrice ?? item.attribute?.actualPrice ?? item.attribute?.price
    );
    const quantity = parseInt(item.qty ?? item.quantity ?? 0, 10) || 0;
    if (quantity === 0) return 0;
    const perUnitDiscount = Math.max(actualPrice - rate, 0);
    return parseFloat((perUnitDiscount * quantity).toFixed(2));
  };

  const getItemHSN = (item) => {
    if (item.hsn) return item.hsn;
    if (item.product?.hsn) return item.product.hsn;
    if (item.attribute?.hsn) return item.attribute.hsn;
    return 'N/A';
  };

  // Auto-download PDF when autoDownload flag is true
  useEffect(() => {
    if (autoDownload && billRef.current) {
      setTimeout(() => {
        handleDownload();
      }, 1000);
    }
  }, [autoDownload]);

  const handleBackToBilling = () => {
    navigate('/billing-report');
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const customerName = finalBillData.customerName.replace(/\s+/g, '_') || 'Customer';
    const billNo = finalBillData.billNo || 'BILL';
    document.title = `${billNo}-${customerName}`;
    
    window.addEventListener('afterprint', () => {
      document.title = originalTitle;
    }, { once: true });
    
    window.print();
  };

  const handleDownload = async () => {
    if (downloadLockRef.current) {
      return;
    }
    downloadLockRef.current = true;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = billRef.current;
      const billWidth = element.offsetWidth;
      const billHeight = element.offsetHeight;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: billWidth,
        height: billHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeightOfImage = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();

      let remainingHeight = pdfHeightOfImage;
      let offsetY = 0;

      pdf.addImage(imgData, 'PNG', 0, offsetY, pdfWidth, pdfHeightOfImage);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        offsetY = remainingHeight - pdfHeightOfImage;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, offsetY, pdfWidth, pdfHeightOfImage);
        remainingHeight -= pageHeight;
      }
      
      const customerName = finalBillData.customerName.replace(/\s+/g, '_') || 'Customer';
      const billNo = finalBillData.billNo || 'BILL';
      const fileName = `${billNo}-${customerName}.pdf`;
      
      pdf.save(fileName);

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
                    {isLaxmiBookstore ? 'LAKSHMI BOOKSTORE' : 'SWASTIK ENTERPRISE'}
                  </h2>
                  <div className="bill-type-badge">Composition Dealer</div>
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

          {/* Items Table - Shows all columns including HSN and Discount */}
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-serial">#</th>
                <th className="col-item">Item Name</th>
                <th className="col-hsn">HSN</th>
                <th className="col-qty">Qty</th>
                <th className="col-rate">Rate (₹)</th>
                <th className="col-discount">Discount (₹)</th>
                {!isLaxmiBookstore && <th className="col-taxable">Taxable (₹)</th>}
                {!isLaxmiBookstore && <th className="col-tax">CGST<br/><span className="tax-percent">(%)</span></th>}
                {!isLaxmiBookstore && <th className="col-tax">SGST<br/><span className="tax-percent">(%)</span></th>}
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
                    <td className="text-center">{getItemHSN(item)}</td>
                    <td className="text-center">{item.qty}</td>
                    <td className="text-right">{item.rate.toFixed(2)}</td>
                    <td className="text-right">{getItemDiscountAmount(item).toFixed(2)}</td>
                    {!isLaxmiBookstore && <td className="text-right">{item.taxable.toFixed(2)}</td>}
                    {!isLaxmiBookstore && (
                      <td className="text-right">
                        {item.cgst.toFixed(2)}
                        <br/>
                        <span className="tax-rate">({item.cgstRate}%)</span>
                      </td>
                    )}
                    {!isLaxmiBookstore && (
                      <td className="text-right">
                        {item.sgst.toFixed(2)}
                        <br/>
                        <span className="tax-rate">({item.sgstRate}%)</span>
                      </td>
                    )}
                    <td className="text-right">{item.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isLaxmiBookstore ? "7" : "10"} className="text-center" style={{padding: '20px', color: '#999'}}>
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
            <div className="footer-company">{isLaxmiBookstore ? 'LAKSHMI BOOKSTORE' : 'SWASTIK ENTERPRISE'}</div>
            <div className="signature-area">
              <div className="signature-line">Authorized Signatory</div>
            </div>
          </div>
          <div className="header-border"></div>
        </div>
      </div>
    </div>
  );
};

export default BillPage;