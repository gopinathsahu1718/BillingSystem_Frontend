import React, { useState } from 'react';
import BillFormat from './BillFormat';

// Example of how to use the BillFormat component with your cart data
const BillExample = () => {
  // Example cart data from your e-commerce application
  const [cartItems] = useState([
    {
      id: 1,
      name: 'Mathematics Textbook Class 10',
      hsn: '49011010',
      qty: 2,
      rate: 350.00,
      taxable: 700.00,
      cgst: 63.00,
      sgst: 63.00,
      total: 826.00
    },
    {
      id: 2,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 3,
      name: 'Copy Register 200 Pages',
      hsn: '48201030',
      qty: 5,
      rate: 45.00,
      taxable: 225.00,
      cgst: 20.25,
      sgst: 20.25,
      total: 265.50
    },
    {
      id: 4,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 5,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 6,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 7,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 8,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 9,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 10,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 11,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    },
    {
      id: 12,
      name: 'Geometry Box Premium',
      hsn: '90171000',
      qty: 1,
      rate: 150.00,
      taxable: 150.00,
      cgst: 13.50,
      sgst: 13.50,
      total: 177.00
    }
  ]);

  // Function to convert number to words (Indian numbering system)
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertUpToThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertUpToThousand(n % 100) : '');
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (crore > 0) result += convertUpToThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertUpToThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertUpToThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertUpToThousand(remainder);

    return result.trim();
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Prepare bill data from cart
  const prepareBillData = () => {
    const grandTotal = calculateGrandTotal();
    
    // Pad items array to 8 rows (as shown in original bill)
    const paddedItems = [...cartItems];
    while (paddedItems.length < 8) {
      paddedItems.push({
        id: paddedItems.length + 1,
        name: '',
        hsn: '',
        qty: '',
        rate: '',
        taxable: 0.00,
        cgst: '-',
        sgst: '-',
        total: 0.00
      });
    }

    return {
      billNo: 'BILL-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      customerName: 'John Doe', // Get from user form
      address: '123 Main Street, City Name', // Get from user form
      contactNo: '9876543210', // Get from user form
      paymentMode: 'Cash', // Get from user form or cart
      items: paddedItems,
      grandTotal: grandTotal,
      rupeesInWords: numberToWords(Math.floor(grandTotal)) + ' Rupees Only',
      bankDetails: {
        bank: 'SBI, PKD',
        accountNo: '11305057961',
        ifsc: 'SBIN0000151',
        branch: 'Paralakhemundi'
      }
    };
  };

  const handlePrintBill = () => {
    window.print();
  };

  const handleDownloadBill = () => {
    // You can implement PDF generation here using libraries like:
    // - html2canvas + jsPDF
    // - react-pdf
    // - @react-pdf/renderer
    alert('Download functionality to be implemented');
  };

  return (
    <div className="bill-example-container">
      <div className="actions">
        <button onClick={handlePrintBill} className="btn-print">
          🖨️ Print Bill
        </button>
        <button onClick={handleDownloadBill} className="btn-download">
          📥 Download PDF
        </button>
      </div>
      
      <BillFormat billData={prepareBillData()} />
    </div>
  );
};

export default BillExample;

// CSS for action buttons
const styles = `
.bill-example-container {
  padding: 20px;
  background: #f5f5f5;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn-print, .btn-download {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-print {
  background: #3498db;
  color: white;
}

.btn-print:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-download {
  background: #27ae60;
  color: white;
}

.btn-download:hover {
  background: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(39, 174, 96, 0.3);
}

@media print {
  .actions {
    display: none;
  }
  
  .bill-example-container {
    padding: 0;
    background: white;
  }
}
`;