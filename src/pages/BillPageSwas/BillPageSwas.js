import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './BillPageSwas.css';

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

const BillPageSwas = () => {
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
    <div className="bill-page-wrapper-swas">
      {/* Action Buttons */}
      <div className="action-buttons-swas no-print">
        <button onClick={handleBackToBilling} className="btn-back-swas">
          ← Back to {autoDownload ? 'Reports' : 'Billing'}
        </button>
        <button onClick={handlePrint} className="btn-print-swas">
          🖨️ Print Bill
        </button>
        <button onClick={handleDownload} className="btn-download-swas">
          📥 Download PDF
        </button>
      </div>

      {/* Bill Container */}
      <div className="bill-page-container-swas">
        <div ref={billRef} className="bill-content-swas">
          
          {/* Top Decorative Strip */}
          <div className="header-strip-swas"></div>

          {/* Header Section */}
          <div className="bill-header-swas">
            <div className="header-layout-swas">
                <div className="logo-section-swas logo-left-swas">
                  <img src={`${publicUrl}/lord_ganesha.jpeg`} alt="Ganesh" className="ganesh-logo-swas" crossOrigin="anonymous" />
                </div>

              <div className="header-center-swas">
                <div className="company-badge-swas">SRI GANESH</div>
                <p className="company-tagline-swas">School, College Books, Office Stationaries & Order Suppliers</p>
                <p className="company-location-swas">Girls High School Road, Paralakhemundi</p>
                
                <div className="enterprise-section-swas">
                  <h1 className="enterprise-name-swas">SWASTIK ENTERPRISE</h1>
                  <div className="invoice-label-swas">TAX INVOICE</div>
                </div>
              </div>

                <div className="logo-section-swas logo-right-swas">
                  <img src={`${publicUrl}/godess_laxmi.jpeg`} alt="Goddess" className="goddess-logo-swas" crossOrigin="anonymous" />
                </div>
            </div>
          </div>

          {/* Company & Bill Info Grid */}
          <div className="info-grid-swas">
            <div className="company-info-card-swas">
              <div className="info-row-swas">
                <span className="info-key-swas">GST No:</span>
                <span className="info-val-swas">21AAACC1206D2ZR</span>
              </div>
              <div className="info-row-swas">
                <span className="info-key-swas">Mobile:</span>
                <span className="info-val-swas">9692405306</span>
              </div>
            </div>
            <div className="bill-info-card-swas">
              <div className="info-row-swas">
                <span className="info-key-swas">Bill No:</span>
                <span className="info-val-swas">{finalBillData.billNo}</span>
              </div>
              <div className="info-row-swas">
                <span className="info-key-swas">Date:</span>
                <span className="info-val-swas">{finalBillData.date}</span>
              </div>
              <div className="info-row-swas">
                <span className="info-key-swas">Time:</span>
                <span className="info-val-swas">{finalBillData.time}</span>
              </div>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="customer-card-swas">
            <div className="card-title-swas">
              <span className="title-icon-swas">👤</span>
              <span>Customer Details</span>
            </div>
            <div className="customer-grid-swas">
              <div className="customer-field-swas">
                <span className="field-label-swas">Name:</span>
                <span className="field-value-swas">{finalBillData.customerName}</span>
              </div>
              <div className="customer-field-swas">
                <span className="field-label-swas">Contact:</span>
                <span className="field-value-swas">{finalBillData.contactNo}</span>
              </div>
              <div className="customer-field-swas full-width-swas">
                <span className="field-label-swas">Address:</span>
                <span className="field-value-swas">{displayAddress}</span>
              </div>
              <div className="customer-field-swas">
                <span className="field-label-swas">Payment:</span>
                <span className="field-value-swas payment-highlight-swas">{finalBillData.paymentMode}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table-swas">
            <thead>
              <tr>
                <th className="col-serial-swas">#</th>
                <th className="col-item-swas">Item Description</th>
                <th className="col-hsn-swas">HSN</th>
                <th className="col-qty-swas">Qty</th>
                <th className="col-rate-swas">Rate</th>
                <th className="col-discount-swas">Disc.</th>
                <th className="col-taxable-swas">Taxable</th>
                <th className="col-tax-swas">CGST<br/><span className="tax-sub-swas">(%)</span></th>
                <th className="col-tax-swas">SGST<br/><span className="tax-sub-swas">(%)</span></th>
                <th className="col-total-swas">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="text-center-swas">{item.id}</td>
                    <td className="text-left-swas">
                      {item.name}
                      {item.attributeName && (
                        <div className="item-attribute-swas">{item.attributeName}</div>
                      )}
                    </td>
                    <td className="text-center-swas">{item.hsn}</td>
                    <td className="text-center-swas">{item.qty}</td>
                    <td className="text-right-swas">₹{item.rate.toFixed(2)}</td>
                    <td className="text-right-swas">₹{item.discount.toFixed(2)}</td>
                    <td className="text-right-swas">₹{item.taxable.toFixed(2)}</td>
                    <td className="text-right-swas">
                      ₹{item.cgst.toFixed(2)}
                      <br/>
                      <span className="tax-rate-swas">({item.cgstRate}%)</span>
                    </td>
                    <td className="text-right-swas">
                      ₹{item.sgst.toFixed(2)}
                      <br/>
                      <span className="tax-rate-swas">({item.sgstRate}%)</span>
                    </td>
                    <td className="text-right-swas total-cell-swas">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="text-center-swas empty-row-swas">
                    No items in this bill
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Grand Total Section */}
          <div className="total-section-swas">
            <div className="total-box-swas">
              <span className="total-text-swas">Grand Total:</span>
              <span className="total-value-swas">₹ {((finalBillData.summary?.total || finalBillData.grandTotal) || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="words-section-swas">
            <span className="words-label-swas">Amount in Words:</span>
            <span className="words-text-swas">{finalBillData.rupeesInWords || ''}</span>
          </div>

          {/* Bank Details Card */}
          <div className="bank-card-swas">
            <div className="card-title-swas">
              <span className="title-icon-swas">🏦</span>
              <span>Bank Details</span>
            </div>
            <div className="bank-grid-swas">
              <div className="bank-field-swas">
                <span className="field-label-swas">Bank:</span>
                <span className="field-value-swas">{bankDetails.bank}</span>
              </div>
              <div className="bank-field-swas">
                <span className="field-label-swas">A/C No:</span>
                <span className="field-value-swas">{bankDetails.accountNo}</span>
              </div>
              <div className="bank-field-swas">
                <span className="field-label-swas">IFSC:</span>
                <span className="field-value-swas">{bankDetails.ifsc}</span>
              </div>
              <div className="bank-field-swas">
                <span className="field-label-swas">Branch:</span>
                <span className="field-value-swas">{bankDetails.branch}</span>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bill-footer-swas">
            <div className="footer-company-swas">SWASTIK ENTERPRISE</div>
            <div className="signature-box-swas">
              <div className="signature-line-swas">Authorized Signatory</div>
            </div>
          </div>

          {/* Bottom Decorative Strip */}
          <div className="footer-strip-swas"></div>
        </div>
      </div>
    </div>
  );
};

export default BillPageSwas;