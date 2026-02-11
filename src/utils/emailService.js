const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send welcome email with credentials to new employee
 */
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
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: bold;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.95;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
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
          display: flex;
          align-items: center;
          gap: 8px;
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
        .password-item {
          background: #fff3cd;
          border-left: 3px solid #ffc107;
        }
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
        .warning-box strong {
          color: #856404;
          font-size: 16px;
          display: block;
          margin-bottom: 10px;
        }
        .warning-box ul {
          margin: 10px 0;
          padding-left: 20px;
          color: #856404;
        }
        .warning-box li {
          margin: 8px 0;
        }
        .login-button {
          text-align: center;
          margin: 30px 0;
        }
        .login-button a {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s;
        }
        .login-button a:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        .info-text {
          color: #666;
          font-size: 15px;
          line-height: 1.8;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          padding: 25px 30px;
          background: #f9f9f9;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
        .footer p {
          margin: 5px 0;
        }
        .emoji {
          font-size: 20px;
        }
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
            <h3><span class="emoji">🔐</span> Your Login Credentials</h3>
            
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
            If you have any questions or need assistance with your account, 
            please don't hesitate to contact your administrator or HR team.
          </p>
          
          <p class="info-text" style="margin-top: 30px;">
            Best regards,<br>
            <strong>OneNest Connect HR Team</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>📧 This is an automated message. Please do not reply to this email.</strong></p>
          <p>© ${new Date().getFullYear()} OneNest Connect. All rights reserved.</p>
          <p style="margin-top: 10px; font-size: 12px; color: #999;">
            If the login button doesn't work, copy and paste this link:<br>
            ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Plain text version
    const emailText = `
🎉 Welcome to OneNest Connect!

Hello ${name},

Your employee account has been created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Employee ID: ${employeeId}
Email: ${email}
Temporary Password: ${tempPassword}
Department: ${department}
Designation: ${designation}

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT SECURITY NOTICE:

- This is a TEMPORARY password for first-time login only
- You MUST change your password immediately after logging in
- NEVER share your credentials with anyone
- Keep this email secure and DELETE it after changing your password

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions, please contact your administrator.

Best regards,
OneNest Connect HR Team

---
This is an automated message. Please do not reply.
    `;

    // Send email using Resend
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'OneNest Connect <onboarding@resend.dev>',
      to: email,
      subject: `🎉 Welcome to OneNest Connect - Your Account Details [${employeeId}]`,
      html: emailHtml,
      text: emailText,
    });

    console.log('✅ Welcome email sent successfully to:', email);
    console.log('📧 Email ID:', data.id);
    
    return {
      success: true,
      messageId: data.id,
      message: 'Welcome email sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, resetUrl) => {
  try {
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
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 30px;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .reset-button {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 20px;
          margin: 25px 0;
          border-radius: 6px;
        }
        .footer {
          text-align: center;
          padding: 25px 30px;
          background: #f9f9f9;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
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
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This link will expire in <strong>10 minutes</strong></li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you access the link above</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
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
    
    return {
      success: true,
      messageId: data.id
    };

  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail
};