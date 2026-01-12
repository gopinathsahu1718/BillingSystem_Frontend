import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

// Base64 encoded images (you'll need to convert your images)
const LORD_GANESHA_BASE64 = 'data:image/png;base64,YOUR_GANESHA_IMAGE_BASE64';
const GODDESS_LAXMI_BASE64 = 'data:image/png;base64,YOUR_LAXMI_IMAGE_BASE64';

const BASE_URL = "http://13.232.200.172/api";

// Fetch store profile data
const fetchStoreProfile = async (categoryType, token) => {
    try {
        const storeType = categoryType === 'laxmi_bookstore' ? 'laxmi' : 'swasthik';
        const response = await axios.get(`${BASE_URL}/store/profile/${storeType}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.data && response.data.success) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch store profile:', error);
        return null;
    }
};

export const generateProfessionalBillPDF = async (billData, categoryType, returnBlob = false, token = null) => {
    // Fetch store profile data
    const storeProfile = await fetchStoreProfile(categoryType, token);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const isLaxmi = categoryType === 'laxmi_bookstore';
    const isSwasthik = categoryType === 'swasthik_enterprises';

    // Exact Colors from Image
    const redColor = [220, 20, 60]; // Crimson Red for "SRI GANESH"
    const darkGrayHeader = [52, 58, 64]; // Dark gray for table header
    const lightPinkBg = [255, 245, 245]; // Light background
    const redBoxBg = [220, 53, 69]; // Red for "TAX INVOICE" box
    const lightRedBorder = [255, 200, 200]; // Light red borders

    let yPos = 20;

    // Top Brown Line
    doc.setDrawColor(139, 69, 19);
    doc.setLineWidth(1.5);
    doc.line(15, 15, pageWidth - 15, 15);

    yPos = 25;

    // ==================== HEADER SECTION ====================
    try {
        // Left Logo - Lord Ganesha
        doc.addImage(LORD_GANESHA_BASE64, 'PNG', 20, yPos, 20, 20);

        // Right Logo - Goddess Laxmi
        doc.addImage(GODDESS_LAXMI_BASE64, 'PNG', pageWidth - 40, yPos, 20, 20);
    } catch (error) {
        console.error('Error loading images:', error);
    }

    // Company Name - "SRI GANESH" in RED
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...redColor);
    doc.text('SRI GANESH', pageWidth / 2, yPos + 8, { align: 'center' });

    // Subtitle lines in black - Use store address from API
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (storeProfile) {
        // Split address into two lines if needed
        const addressLine1 = storeProfile.address.substring(0, 60);
        const addressLine2 = storeProfile.address.substring(60);

        doc.text(addressLine1, pageWidth / 2, yPos + 14, { align: 'center' });
        if (addressLine2.trim()) {
            doc.text(addressLine2, pageWidth / 2, yPos + 18, { align: 'center' });
            yPos += 4; // Add extra space if second line exists
        } else {
            // Use city info if no second line
            doc.text(`${storeProfile.city}, ${storeProfile.state} - ${storeProfile.pincode}`, pageWidth / 2, yPos + 18, { align: 'center' });
        }
    } else {
        // Fallback to default
        doc.text('School, College Books, Office Stationaries & Order Suppliers', pageWidth / 2, yPos + 14, { align: 'center' });
        doc.text('Girls High School Road, Paralakhemundi', pageWidth / 2, yPos + 18, { align: 'center' });
    }

    yPos += 22;

    // Store Name Badge - Use from API
    doc.setFillColor(230, 230, 250);
    doc.roundedRect(pageWidth / 2 - 40, yPos, 80, 8, 2, 2, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const storeName = storeProfile ? storeProfile.storeName.toUpperCase() : (isLaxmi ? 'LAKSHMI BOOKSTORE' : 'SWASTIK ENTERPRISE');
    doc.text(storeName, pageWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 11;

    // "TAX INVOICE" - Red Box with White Text
    doc.setFillColor(...redBoxBg);
    doc.roundedRect(pageWidth / 2 - 18, yPos, 36, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TAX INVOICE', pageWidth / 2, yPos + 4, { align: 'center' });

    yPos += 10;

    // ==================== GST & MOBILE ROW ====================
    // Light pink background box
    doc.setFillColor(...lightPinkBg);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    // Left - GST NO (only for Swasthik)
    if (isSwasthik && storeProfile) {
        doc.text('GST NO:', 18, yPos + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(storeProfile.gstNumber || '21AAACC1206D2ZR', 33, yPos + 4.5);
    } else if (isSwasthik) {
        doc.text('GST NO:', 18, yPos + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text('21AAACC1206D2ZR', 33, yPos + 4.5);
    }

    // Right - MOBILE - Use from API
    doc.setFont('helvetica', 'bold');
    doc.text('MOBILE:', pageWidth - 50, yPos + 4.5);
    doc.setFont('helvetica', 'normal');
    const mobileNumber = storeProfile ? storeProfile.phone : '9692405306';
    doc.text(mobileNumber, pageWidth - 35, yPos + 4.5);

    yPos += 10;

    // ==================== BILL INFO ROW ====================
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    const billDate = new Date(billData.createdAt);
    const dateStr = `${billDate.getDate()}/${billDate.getMonth() + 1}/${billDate.getFullYear()}`;
    const timeStr = billDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    doc.text('Bill No:', 18, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(billData.billNumber, 32, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', pageWidth / 2 - 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(dateStr, pageWidth / 2 - 10, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Time:', pageWidth - 50, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(timeStr, pageWidth - 40, yPos);

    yPos += 7;

    // ==================== CUSTOMER DETAILS BOX ====================
    // Box with red left border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...lightRedBorder);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, pageWidth - 30, 24, 1, 1, 'FD');

    // Red left border accent
    doc.setFillColor(...redBoxBg);
    doc.rect(15, yPos, 2, 24, 'F');

    const detailsX = 22;
    let detailsY = yPos + 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Customer Name with bullet point
    doc.text('•', detailsX, detailsY);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Name:', detailsX + 3, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(billData.customerName, detailsX + 35, detailsY);

    detailsY += 5;

    // Address with bullet point
    doc.text('•', detailsX, detailsY);
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', detailsX + 3, detailsY);
    doc.setFont('helvetica', 'normal');
    if (billData.customerAddress) {
        const addressLines = doc.splitTextToSize(billData.customerAddress, pageWidth - 70);
        doc.text(addressLines, detailsX + 35, detailsY);
    }

    detailsY += 5;

    // Contact No with bullet point
    doc.text('•', detailsX, detailsY);
    doc.setFont('helvetica', 'bold');
    doc.text('Contact No:', detailsX + 3, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(billData.customerContact, detailsX + 35, detailsY);

    detailsY += 5;

    // Payment Mode with bullet point
    doc.text('•', detailsX, detailsY);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Mode:', detailsX + 3, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(billData.paymentMode, detailsX + 35, detailsY);

    yPos += 28;

    // ==================== ITEMS TABLE ====================
    let tableColumn, tableRows;

    if (isSwasthik) {
        // Swasthik - WITH Tax Columns
        tableColumn = ['#', 'Item Name', 'HSN', 'Qty', 'Rate (Rs)', 'Discount\n(%)', 'Taxable (Rs)', 'CGST', 'SGST', 'Total (Rs)'];

        tableRows = billData.items.map((item, index) => {
            const itemName = item.productName +
                (item.attributeValue ? `\n(${item.attributeValue})` : '');

            const quantity = item.quantity;
            const unitPrice = parseFloat(item.unitPrice);
            const gstRate = parseFloat(item.gstRate || 0);

            const discount = 0.00;
            const subtotalBeforeGST = unitPrice * quantity - discount;
            const taxableAmount = subtotalBeforeGST / (1 + (gstRate / 100));
            const totalGSTAmount = subtotalBeforeGST - taxableAmount;
            const cgst = totalGSTAmount / 2;
            const sgst = totalGSTAmount / 2;

            return [
                (index + 1).toString(),
                itemName,
                item.productSKU || '9473',
                quantity.toString(),
                unitPrice.toFixed(2),
                discount.toFixed(2),
                taxableAmount.toFixed(2),
                `${cgst.toFixed(2)}\n(${gstRate}%)`,
                `${sgst.toFixed(2)}\n(${gstRate}%)`,
                parseFloat(item.total).toFixed(2)
            ];
        });
    } else {
        // Laxmi - WITHOUT Tax Columns
        tableColumn = ['#', 'Item Name', 'HSN', 'Qty', 'Rate (Rs)', 'Discount\n(%)', 'Total (Rs)'];

        tableRows = billData.items.map((item, index) => {
            const itemName = item.productName +
                (item.attributeValue ? `\n(${item.attributeValue})` : '');

            const discount = 0.00;

            return [
                (index + 1).toString(),
                itemName,
                item.productSKU || '9473',
                item.quantity.toString(),
                parseFloat(item.unitPrice).toFixed(2),
                discount.toFixed(2),
                parseFloat(item.total).toFixed(2)
            ];
        });
    }

    autoTable(doc, {
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [52, 58, 64], // Dark gray header
            textColor: [255, 255, 255],
            fontSize: 7,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [200, 200, 200],
            cellPadding: 2,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            cellPadding: 3,
            lineWidth: 0.1,
            lineColor: [220, 220, 220],
        },
        columnStyles: isSwasthik ? {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left', cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 12 },
            4: { halign: 'right', cellWidth: 18 },
            5: { halign: 'right', cellWidth: 18 },
            6: { halign: 'right', cellWidth: 20 },
            7: { halign: 'center', cellWidth: 18, fillColor: [255, 235, 235] }, // Light red for CGST
            8: { halign: 'center', cellWidth: 18, fillColor: [255, 235, 235] }, // Light red for SGST
            9: { halign: 'right', cellWidth: 18 },
        } : {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left', cellWidth: 'auto' },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 25 },
            6: { halign: 'right', cellWidth: 25 },
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255],
        },
        margin: { left: 15, right: 15 },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ==================== GRAND TOTAL BOX ====================
    // Grand Total with red border box
    doc.setDrawColor(...redBoxBg);
    doc.setLineWidth(2);
    doc.roundedRect(pageWidth - 75, yPos, 60, 10, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Grand Total:', pageWidth - 72, yPos + 7);

    doc.setTextColor(...redBoxBg);
    doc.setFontSize(14);
    doc.text(`Rs ${parseFloat(billData.grandTotal).toFixed(2)}`, pageWidth - 18, yPos + 7, { align: 'right' });

    yPos += 15;

    // ==================== RUPEES IN WORDS ====================
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(15, yPos, pageWidth - 30, 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Rupees (in words):', 18, yPos + 5);

    doc.setFont('helvetica', 'normal');
    const amountInWords = numberToWords(parseFloat(billData.grandTotal));
    doc.text(amountInWords, 50, yPos + 5);

    yPos += 12;

    // ==================== PAYMENT DETAILS BOX ====================
    // Box with red left border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...lightRedBorder);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, pageWidth - 30, 22, 1, 1, 'FD');

    // Red left border accent
    doc.setFillColor(...redBoxBg);
    doc.rect(15, yPos, 2, 22, 'F');

    // Payment Details Title
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Details', 22, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Two column layout - Use data from API
    const leftCol = 22;
    const rightCol = pageWidth / 2 + 10;
    let payY = yPos + 10;

    if (storeProfile) {
        // Use API data
        doc.setFont('helvetica', 'bold');
        doc.text('Bank:', leftCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${storeProfile.bankName}, ${storeProfile.city.substring(0, 3).toUpperCase()}`, leftCol + 15, payY);

        doc.setFont('helvetica', 'bold');
        doc.text('A/C No:', rightCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text(storeProfile.accountNumber, rightCol + 15, payY);

        payY += 5;

        doc.setFont('helvetica', 'bold');
        doc.text('Branch:', leftCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text(storeProfile.branchName, leftCol + 15, payY);

        doc.setFont('helvetica', 'bold');
        doc.text('IFSC Code:', rightCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text(storeProfile.ifscCode, rightCol + 15, payY);
    } else {
        // Fallback to default
        doc.setFont('helvetica', 'bold');
        doc.text('Bank:', leftCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text('SBI, PKD', leftCol + 15, payY);

        doc.setFont('helvetica', 'bold');
        doc.text('A/C No:', rightCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text('11305057961', rightCol + 15, payY);

        payY += 5;

        doc.setFont('helvetica', 'bold');
        doc.text('Branch:', leftCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text('Paralakhemundi', leftCol + 15, payY);

        doc.setFont('helvetica', 'bold');
        doc.text('IFSC Code:', rightCol, payY);
        doc.setFont('helvetica', 'normal');
        doc.text('SBIN0000151', rightCol + 15, payY);
    }

    yPos += 26;

    // ==================== SIGNATURE SECTION ====================
    // Black bar
    doc.setFillColor(52, 58, 64);
    doc.rect(15, yPos, pageWidth - 30, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const companyName = storeProfile ? storeProfile.storeName.toUpperCase() : (isLaxmi ? 'LAKSHMI BOOKSTORE' : 'SWASTIK ENTERPRISE');
    doc.text(`For ${companyName}`, pageWidth / 2, yPos + 4, { align: 'center' });

    yPos += 10;

    // Signature space (blank area for manual signature)
    yPos += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Authorized Signatory', pageWidth - 18, yPos, { align: 'right' });

    // ==================== FOOTER WARNING ====================
    yPos += 5;

    doc.setFillColor(255, 248, 220);
    doc.setDrawColor(255, 193, 7);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, pageWidth - 30, 8, 'FD');

    doc.setTextColor(150, 100, 0);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('Composition Dealer not eligible for Collection on supply of services.', pageWidth / 2, yPos + 5, { align: 'center' });

    // Save or return PDF
    if (returnBlob) {
        return doc.output('blob');
    } else {
        doc.save(`${billData.billNumber}.pdf`);
        return doc;
    }
};

// Helper function to convert numbers to words
function numberToWords(amount) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (amount === 0) return 'Zero Rupees Only';

    let rupees = Math.floor(amount);
    let paise = Math.round((amount - rupees) * 100);

    let words = '';

    if (rupees >= 10000000) {
        const crores = Math.floor(rupees / 10000000);
        words += convertToWords(crores) + ' Crore ';
        rupees %= 10000000;
    }

    if (rupees >= 100000) {
        const lakhs = Math.floor(rupees / 100000);
        words += convertToWords(lakhs) + ' Lakh ';
        rupees %= 100000;
    }

    if (rupees >= 1000) {
        const thousands = Math.floor(rupees / 1000);
        words += convertToWords(thousands) + ' Thousand ';
        rupees %= 1000;
    }

    if (rupees >= 100) {
        words += ones[Math.floor(rupees / 100)] + ' Hundred ';
        rupees %= 100;
    }

    if (rupees >= 20) {
        words += tens[Math.floor(rupees / 10)] + ' ';
        rupees %= 10;
    } else if (rupees >= 10) {
        words += teens[rupees - 10] + ' ';
        rupees = 0;
    }

    if (rupees > 0) {
        words += ones[rupees] + ' ';
    }

    words += 'Rupees';

    if (paise > 0) {
        words += ' and ' + convertToWords(paise) + ' Paise';
    }

    words += ' Only';

    return words.trim();
}

function convertToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return '';

    let words = '';

    if (num >= 20) {
        words += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
    } else if (num >= 10) {
        return teens[num - 10];
    }

    if (num > 0) {
        words += ones[num];
    }

    return words.trim();
}

export default generateProfessionalBillPDF;