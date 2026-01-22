const PDFDocument = require('pdfkit');

function generateInvoicePDF(quotation, res) {
  const doc = new PDFDocument({ 
    size: 'A4',
    margin: 50 
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${quotation.invoiceNumber}.pdf`);
  
  doc.pipe(res);

  // Colors
  const primaryColor = '#2c5aa0';
  const lightBlue = '#e8f0f8';
  const darkGray = '#333333';
  const lightGray = '#666666';

  // Header - Company Info
  doc.fillColor(primaryColor)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('YOUR COMPANY NAME', 50, 50);
  
  doc.fillColor(darkGray)
     .fontSize(10)
     .font('Helvetica')
     .text('Street Address', 50, 80)
     .text('City, ST  ZIP Code', 50, 95)
     .text('Phone Number, Web Address, etc.', 50, 110);

  // Invoice Title
  doc.fillColor(primaryColor)
     .fontSize(36)
     .font('Helvetica-Bold')
     .text('INVOICE', 400, 50, { align: 'right' });

  // Horizontal line after header
  doc.moveTo(50, 140)
     .lineTo(550, 140)
     .strokeColor(primaryColor)
     .lineWidth(2)
     .stroke();

  // Invoice Details (top right)
  doc.fillColor(darkGray)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('DATE:', 420, 170)
     .text('INVOICE #:', 420, 190);
  
  doc.font('Helvetica')
     .text(new Date(quotation.createdAt).toLocaleDateString('en-US', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric' 
     }), 500, 170)
     .text(quotation.invoiceNumber, 500, 190);

  // Bill To & Ship To Section
  let yPos = 170;

  // Bill To
  doc.fillColor(darkGray)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('Bill To:', 50, yPos);
  
  doc.font('Helvetica')
     .text(quotation.customer.code || '', 100, yPos);
  
  doc.text(quotation.billTo?.name || quotation.customer.name, 50, yPos + 15);
  
  if (quotation.billTo?.address || quotation.customer.address) {
    doc.text(quotation.billTo?.address || quotation.customer.address, 50, yPos + 30, { width: 200 });
  }

  // Ship To
  if (quotation.shipTo?.name) {
    doc.font('Helvetica-Bold')
       .text('Ship To:', 320, yPos);
    
    doc.font('Helvetica')
       .text(quotation.shipTo.name, 320, yPos + 15);
    
    if (quotation.shipTo.address) {
      doc.text(quotation.shipTo.address, 320, yPos + 30, { width: 200 });
    }
  }

  // Order Details Table Header
  yPos = 280;
  doc.rect(50, yPos, 500, 25)
     .fillAndStroke(lightBlue, primaryColor);

  doc.fillColor(darkGray)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('P.O. #', 55, yPos + 8)
     .text('Sales Rep. Name', 120, yPos + 8)
     .text('Ship Date', 230, yPos + 8)
     .text('Ship Via', 310, yPos + 8)
     .text('Terms', 390, yPos + 8)
     .text('Due Date', 470, yPos + 8);

  // Order Details Data
  yPos += 25;
  doc.font('Helvetica')
     .text(quotation.poNumber || '', 55, yPos + 5)
     .text(quotation.salesRep || '', 120, yPos + 5)
     .text(quotation.shipDate ? new Date(quotation.shipDate).toLocaleDateString() : '', 230, yPos + 5)
     .text(quotation.shipVia || '', 310, yPos + 5)
     .text(quotation.terms || '', 390, yPos + 5)
     .text(quotation.dueDate ? new Date(quotation.dueDate).toLocaleDateString() : '', 470, yPos + 5);

  // Items Table Header
  yPos += 40;
  doc.rect(50, yPos, 500, 25)
     .fillAndStroke(lightBlue, primaryColor);

  doc.fillColor(darkGray)
     .fontSize(9)
     .font('Helvetica-Bold')
     .text('Description', 55, yPos + 8)
     .text('Quantity', 350, yPos + 8, { width: 60, align: 'center' })
     .text('Unit Price', 420, yPos + 8, { width: 60, align: 'right' })
     .text('Amount', 490, yPos + 8, { width: 50, align: 'right' });

  // Items
  yPos += 25;
  doc.font('Helvetica').fontSize(9);

  quotation.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.rect(50, yPos, 500, 20).fillAndStroke('#f9f9f9', '#f9f9f9');
    }

    doc.fillColor(darkGray)
       .text(item.description, 55, yPos + 5, { width: 280 })
       .text(item.quantity.toFixed(2), 350, yPos + 5, { width: 60, align: 'center' })
       .text(item.unitPrice.toFixed(2), 420, yPos + 5, { width: 60, align: 'right' })
       .text(item.amount.toFixed(2), 490, yPos + 5, { width: 50, align: 'right' });

    yPos += 20;
  });

  // Totals Section
  yPos += 30;

  // SUBTOTAL
  doc.fillColor(darkGray)
     .font('Helvetica-Bold')
     .text('SUBTOTAL', 400, yPos, { width: 80, align: 'right' })
     .font('Helvetica')
     .text(quotation.subtotal.toFixed(2), 490, yPos, { width: 50, align: 'right' });

  // GST
  yPos += 20;
  doc.font('Helvetica-Bold')
     .text('GST', 400, yPos, { width: 80, align: 'right' })
     .font('Helvetica')
     .text(`${quotation.gst.toFixed(2)}%`, 450, yPos, { width: 30, align: 'right' })
     .text(quotation.gstAmount.toFixed(2), 490, yPos, { width: 50, align: 'right' });

  // SHIPPING & HANDLING
  yPos += 20;
  doc.font('Helvetica-Bold')
     .text('SHIPPING & HANDLING', 400, yPos, { width: 80, align: 'right' })
     .font('Helvetica')
     .text(quotation.shipping > 0 ? quotation.shipping.toFixed(2) : '-', 490, yPos, { width: 50, align: 'right' });

  // TOTAL
  yPos += 20;
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text('TOTAL', 400, yPos, { width: 80, align: 'right' })
     .text(quotation.total.toFixed(2), 490, yPos, { width: 50, align: 'right' });

  // PAID
  yPos += 20;
  doc.fontSize(10)
     .text('PAID', 400, yPos, { width: 80, align: 'right' })
     .font('Helvetica')
     .text(quotation.paid > 0 ? quotation.paid.toFixed(2) : '-', 490, yPos, { width: 50, align: 'right' });

  // TOTAL DUE
  yPos += 20;
  doc.font('Helvetica-Bold')
     .fontSize(11)
     .text('TOTAL DUE', 400, yPos, { width: 80, align: 'right' })
     .text(quotation.totalDue.toFixed(2), 490, yPos, { width: 50, align: 'right' });

  // Company Logo/Watermark (bottom left)
  doc.fontSize(24)
     .fillColor('#cccccc')
     .font('Helvetica-Bold')
     .text('UniformSoftware', 50, 720, { width: 200 });

  // Thank You Message
  doc.fontSize(12)
     .fillColor(darkGray)
     .font('Helvetica-Oblique')
     .text('THANK YOU FOR YOUR BUSINESS!', 50, 770, { width: 500, align: 'center' });

  doc.end();
}

module.exports = { generateInvoicePDF };