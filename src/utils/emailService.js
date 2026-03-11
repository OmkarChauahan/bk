const { Resend } = require('resend');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ── Initialize Resend ────────────────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ── Helper ───────────────────────────────────────────────────────────────────
const fmt = (amount) => `Rs.${(amount || 0).toLocaleString('en-IN')}`;


// ════════════════════════════════════════════════════════════════════════════
//  1.  WELCOME EMAIL  (new employee credentials)
// ════════════════════════════════════════════════════════════════════════════
const sendWelcomeEmail = async (employeeData) => {
  try {
    const { name, email, employeeId, tempPassword, department, designation } = employeeData;

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p  { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
        .content   { padding: 30px; }
        .greeting  { font-size: 18px; color: #333; margin-bottom: 20px; }
        .credentials-box {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 10px;
          padding: 25px;
          margin: 25px 0;
          border: 2px solid #667eea;
        }
        .credentials-box h3 {
          margin: 0 0 20px 0;
          color: #667eea;
          font-size: 18px;
        }
        .credential-item {
          margin: 15px 0;
          background: white;
          padding: 12px 15px;
          border-radius: 6px;
          border-left: 3px solid #667eea;
        }
        .credential-item label {
          font-weight: 600;
          color: #666;
          display: block;
          font-size: 12px;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .credential-item .value {
          font-size: 16px;
          color: #333;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
        .password-item  { background: #fff3cd; border-left: 3px solid #ffc107; }
        .password-value {
          color: #d63031;
          font-size: 18px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          display: inline-block;
          border: 2px dashed #d63031;
        }
        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .warning-box strong { color: #856404; font-size: 16px; display: block; margin-bottom: 10px; }
        .warning-box ul     { margin: 10px 0; padding-left: 20px; color: #856404; }
        .warning-box li     { margin: 8px 0; }
        .login-button       { text-align: center; margin: 30px 0; }
        .login-button a {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(102,126,234,0.4);
        }
        .info-text { color: #666; font-size: 15px; line-height: 1.8; margin: 15px 0; }
        .footer {
          text-align: center;
          padding: 25px 30px;
          background: #f9f9f9;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎉 Welcome to OneNest Connect!</h1>
          <p>Your employee account has been created successfully</p>
        </div>
        <div class="content">
          <p class="greeting">Hello <strong>${name}</strong>,</p>
          <p class="info-text">
            Welcome aboard! We're excited to have you join our team at OneNest Connect.
            Your employee account has been set up and you can now access our system
            to manage your work, track attendance, and collaborate with your team.
          </p>
          <div class="credentials-box">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
              <label>Employee ID</label>
              <div class="value">${employeeId}</div>
            </div>
            <div class="credential-item">
              <label>Email Address (Username)</label>
              <div class="value">${email}</div>
            </div>
            <div class="credential-item password-item">
              <label>Temporary Password</label>
              <div class="password-value">${tempPassword}</div>
            </div>
            <div class="credential-item">
              <label>Department</label>
              <div class="value">${department}</div>
            </div>
            <div class="credential-item">
              <label>Designation</label>
              <div class="value">${designation}</div>
            </div>
          </div>
          <div class="warning-box">
            <strong>⚠️ Important Security Notice</strong>
            <ul>
              <li>This is a <strong>temporary password</strong> for first-time login only</li>
              <li>You <strong>must change</strong> your password immediately after logging in</li>
              <li><strong>Never share</strong> your credentials with anyone</li>
              <li>Keep this email secure and <strong>delete it</strong> after changing your password</li>
              <li>If you didn't request this account, please contact IT support immediately</li>
            </ul>
          </div>
          <div class="login-button">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">
              🚀 Login to Your Account
            </a>
          </div>
          <p class="info-text">
            If you have any questions or need assistance, please contact your administrator or HR team.
          </p>
          <p class="info-text" style="margin-top:30px;">
            Best regards,<br><strong>OneNest Connect HR Team</strong>
          </p>
        </div>
        <div class="footer">
          <p><strong>📧 This is an automated message. Please do not reply to this email.</strong></p>
          <p>© ${new Date().getFullYear()} OneNest Connect. All rights reserved.</p>
          <p style="margin-top:10px;font-size:12px;color:#999;">
            If the login button doesn't work, copy and paste this link:<br>
            ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    const emailText = `
🎉 Welcome to OneNest Connect!

Hello ${name},

Your employee account has been created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Employee ID  : ${employeeId}
Email        : ${email}
Temp Password: ${tempPassword}
Department   : ${department}
Designation  : ${designation}

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT SECURITY NOTICE:
- This is a TEMPORARY password for first-time login only
- You MUST change your password immediately after logging in
- NEVER share your credentials with anyone

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
OneNest Connect HR Team
---
This is an automated message. Please do not reply.
    `;

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'OneNest Connect <onboarding@resend.dev>',
      to: email,
      subject: `🎉 Welcome to OneNest Connect - Your Account Details [${employeeId}]`,
      html: emailHtml,
      text: emailText,
    });

    console.log('✅ Welcome email sent to:', email, '| ID:', data.id);
    return { success: true, messageId: data.id, message: 'Welcome email sent successfully' };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};


// ════════════════════════════════════════════════════════════════════════════
//  2.  PASSWORD RESET EMAIL
// ════════════════════════════════════════════════════════════════════════════
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; color: #333;
          max-width: 600px; margin: 0 auto;
          padding: 20px; background-color: #f5f5f5;
        }
        .email-container {
          background: white; border-radius: 12px;
          overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 40px 30px; text-align: center;
        }
        .header h1 { margin: 0; font-size: 28px; }
        .content   { padding: 30px; }
        .button-container { text-align: center; margin: 30px 0; }
        .reset-button {
          display: inline-block; padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; text-decoration: none;
          border-radius: 8px; font-weight: bold; font-size: 16px;
          box-shadow: 0 4px 15px rgba(102,126,234,0.4);
        }
        .warning-box {
          background: #fff3cd; border-left: 4px solid #ffc107;
          padding: 20px; margin: 25px 0; border-radius: 6px;
        }
        .footer {
          text-align: center; padding: 25px 30px;
          background: #f9f9f9; border-top: 1px solid #e0e0e0;
          color: #666; font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          <p>You recently requested to reset your password for your OneNest Connect account.
             Click the button below to reset it:</p>
          <div class="button-container">
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
          </div>
          <div class="warning-box">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin:10px 0;padding-left:20px;">
              <li>This link will expire in <strong>10 minutes</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you access the link above</li>
            </ul>
          </div>
          <p style="color:#666;font-size:14px;margin-top:30px;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${resetUrl}" style="color:#667eea;word-break:break-all;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p><strong>This is an automated message. Please do not reply.</strong></p>
          <p>© ${new Date().getFullYear()} OneNest Connect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'OneNest Connect <noreply@resend.dev>',
      to: email,
      subject: '🔐 Password Reset Request - OneNest Connect',
      html: emailHtml,
    });

    console.log('✅ Password reset email sent to:', email);
    return { success: true, messageId: data.id };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};


// ════════════════════════════════════════════════════════════════════════════
//  3.  QUOTATION EMAIL  (PDF attached)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Internal helper – generates a PDF buffer from a quotation object.
 */
const generatePDFBuffer = (quotation) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 60, left: 50, right: 50 }
    });

    const buffers = [];
    doc.on('data',  (data) => buffers.push(data));
    doc.on('end',   ()     => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#5a67d8';
    const textColor    = '#222';
    const pageWidth    = doc.page.width;
    const headerY      = 40;

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(textColor).font('Helvetica')
      .text('Mob: +91 8588942008',         50, headerY)
      .text('Email: info@onenestconnect.in', 50, headerY + 12);

    const logoPath = path.join(__dirname, '../assets/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth - 160, headerY - 5, { width: 110 });
    }

    doc.moveTo(50, headerY + 30).lineTo(pageWidth - 50, headerY + 30)
      .strokeColor(primaryColor).lineWidth(2).stroke();

    // ── Title ────────────────────────────────────────────────────────────────
    doc.fontSize(22).fillColor(primaryColor).font('Helvetica-Bold')
      .text('QUOTATION', 50, headerY + 45);

    // ── Bill To ──────────────────────────────────────────────────────────────
    let yPos = headerY + 85;

    doc.fontSize(10).fillColor(textColor).font('Helvetica-Bold').text('Bill To:', 50, yPos);
    yPos += 15;
    doc.fontSize(11).text(quotation.customer.name  || '', 50, yPos); yPos += 14;
    doc.fontSize(9).font('Helvetica')
      .text(quotation.customer.email || '', 50, yPos); yPos += 12;
    doc.text(quotation.customer.phone || '', 50, yPos); yPos += 12;
    if (quotation.customer.company) { doc.text(quotation.customer.company, 50, yPos); yPos += 12; }
    if (quotation.customer.address) { doc.text(quotation.customer.address, 50, yPos); yPos += 12; }
    if (quotation.customer.gst)     { doc.text(`GST: ${quotation.customer.gst}`, 50, yPos); }

    // ── Meta (right side) ────────────────────────────────────────────────────
    const rightStart = pageWidth - 220;
    let metaY = headerY + 85;

    doc.fontSize(9).font('Helvetica-Bold').text('Quotation #:', rightStart, metaY);
    doc.font('Helvetica').text(quotation.quotationNumber || '', rightStart + 90, metaY, { width: 120, lineBreak: false });
    metaY += 14;
    doc.font('Helvetica-Bold').text('Date:', rightStart, metaY);
    doc.font('Helvetica').text(new Date(quotation.createdAt).toLocaleDateString('en-IN'), rightStart + 90, metaY, { lineBreak: false });
    metaY += 14;
    doc.font('Helvetica-Bold').text('Valid Until:', rightStart, metaY);
    doc.font('Helvetica').text(new Date(quotation.validUntil).toLocaleDateString('en-IN'), rightStart + 90, metaY, { lineBreak: false });

    // ── Items Table ──────────────────────────────────────────────────────────
    yPos = 220;

    doc.rect(50, yPos, pageWidth - 100, 25).fillAndStroke('#f1f3f5', '#dee2e6');
    doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold')
      .text('#',              60, yPos + 7)
      .text('Service / Item', 90, yPos + 7)
      .text('Qty',           300, yPos + 7)
      .text('Price',         340, yPos + 7)
      .text('Tax%',          400, yPos + 7)
      .text('Amount',        460, yPos + 7);

    yPos += 30;
    doc.font('Helvetica').fontSize(9).fillColor(textColor);

    quotation.items.forEach((item, index) => {
      const bg = index % 2 === 0 ? '#f9fafb' : 'white';
      doc.rect(50, yPos - 4, pageWidth - 100, 20).fillColor(bg).fill();
      doc.fillColor(textColor)
        .text(String(index + 1),           60, yPos)
        .text(item.serviceName || '',       90, yPos, { width: 200, lineBreak: false })
        .text(String(item.quantity || 0),  300, yPos)
        .text(fmt(item.unitPrice),         340, yPos)
        .text(`${item.tax || 0}%`,         400, yPos)
        .text(fmt(item.amount),            460, yPos);
      yPos += 20;
    });

    // ── Totals ───────────────────────────────────────────────────────────────
    yPos += 15;
    doc.moveTo(350, yPos).lineTo(pageWidth - 50, yPos)
      .strokeColor('#dee2e6').lineWidth(1).stroke();
    yPos += 8;

    const addRow = (label, value, bold = false) => {
      bold
        ? doc.font('Helvetica-Bold').fontSize(10)
        : doc.font('Helvetica').fontSize(9);
      doc.fillColor(textColor).text(label, 350, yPos).text(value, 460, yPos);
      yPos += 16;
    };

    addRow('Subtotal:',   fmt(quotation.subtotal));
    addRow('Discount:',  `-${fmt(quotation.totalDiscount)}`);
    addRow('Tax (GST):',  fmt(quotation.totalTax));
    doc.moveTo(350, yPos).lineTo(pageWidth - 50, yPos)
      .strokeColor(primaryColor).lineWidth(1.5).stroke();
    yPos += 6;
    addRow('Grand Total:', fmt(quotation.grandTotal), true);

    // ── Notes ────────────────────────────────────────────────────────────────
    if (quotation.notes) {
      yPos += 20;
      doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Notes:', 50, yPos);
      doc.fontSize(9).fillColor(textColor).font('Helvetica')
        .text(quotation.notes, 50, yPos + 14, { width: pageWidth - 100 });
      yPos += 40;
    }

    // ── Terms ────────────────────────────────────────────────────────────────
    if (quotation.terms) {
      yPos += 10;
      doc.fontSize(10).fillColor(primaryColor).font('Helvetica-Bold').text('Terms & Conditions:', 50, yPos);
      doc.fontSize(9).fillColor(textColor).font('Helvetica')
        .text(quotation.terms, 50, yPos + 14, { width: pageWidth - 100 });
      yPos += 50;
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    yPos += 20;
    doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos)
      .strokeColor(primaryColor).lineWidth(1).stroke();

    doc.fontSize(8).font('Helvetica').fillColor(textColor)
      .text('Sector-44, Noida UP - 201301', 50, yPos + 8,
        { align: 'center', width: pageWidth - 100 })
      .text('Mob: +91 8588942008 | Email: info@onenestconnect.in | Website: www.onenestconnect.in',
        50, yPos + 20, { align: 'center', width: pageWidth - 100 });

    doc.end();
  });
};

/**
 * Sends a quotation email with PDF attachment to the customer.
 *
 * @param {Object} quotation  - Full quotation document from DB
 */
const sendQuotationEmail = async (quotation) => {
  try {
    const pdfBuffer = await generatePDFBuffer(quotation);
    const { customer } = quotation;

    const validUntilDate = new Date(quotation.validUntil).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #374151; margin: 0; padding: 0; background: #f9fafb; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px 40px; color: white; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p  { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
          .body { padding: 32px 40px; }
          .body p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
          .info-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; font-weight: bold; font-size: 15px; color: #4f46e5; }
          .info-label { color: #6b7280; }
          .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>OneNest Connect</h1>
            <p>Professional IT Services &amp; Solutions</p>
          </div>
          <div class="body">
            <p>Dear <strong>${customer.name}</strong>,</p>
            <p>Thank you for your interest. Please find your quotation details below and attached as PDF.</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Quotation Number</span>
                <span>${quotation.quotationNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Valid Until</span>
                <span>${validUntilDate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Grand Total</span>
                <span>${fmt(quotation.grandTotal)}</span>
              </div>
            </div>
            <p>Please review the attached PDF. Feel free to contact us for any questions.</p>
            <p style="color:#6b7280;font-size:13px;">
              This quotation is valid until <strong>${validUntilDate}</strong>.
            </p>
          </div>
          <div class="footer">
            <p>OneNest Connect | info@onenestconnect.in</p>
            <p>Sector-44, Noida UP - 201301 | www.onenestconnect.in</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: customer.email,
      subject: `Quotation ${quotation.quotationNumber} from OneNest Connect`,
      html: emailHtml,
      attachments: [
        {
          filename: `Quotation-${quotation.quotationNumber}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Quotation email sent to:', customer.email, '| ID:', data.id);
    return { success: true, messageId: data.id };

  } catch (error) {
    console.error('❌ Quotation email service error:', error.message);
    return { success: false, error: error.message };
  }
};


// ── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendQuotationEmail,        // ← naya add hua
};