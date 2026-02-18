// ============================================================
// backend/services/whatsappService.js
// Install: npm install whatsapp-web.js qrcode-terminal node-cron
// ============================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const Attendance = require('../models/Attendance'); // ✅ Tera actual path
const User = require('../models/User');             // ✅ Tera actual path

// ── WhatsApp Client Setup ───────────────────────────────────────────────────
const waClient = new Client({
  authStrategy: new LocalAuth(), // Session save hogi — baar baar QR scan nahi karna
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// QR Code — pehli baar company phone se scan karo
waClient.on('qr', (qr) => {
  console.log('\n📱 WhatsApp QR Code — Company phone se scan karo:\n');
  qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
  console.log('✅ WhatsApp Connected! Checkout reminders active.');
});

waClient.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp Auth Failed:', msg);
});

waClient.on('disconnected', (reason) => {
  console.log('❌ WhatsApp Disconnected:', reason);
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');

const timeStrToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '-' || timeStr === '--') return null;
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let [, h, m, period] = ampmMatch;
    h = parseInt(h); m = parseInt(m);
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const plainMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (plainMatch) return parseInt(plainMatch[1]) * 60 + parseInt(plainMatch[2]);
  return null;
};

const minutesToTimeStr = (totalMins) => {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${pad(displayH)}:${pad(m)} ${period}`;
};

// Aaj ki date ka start aur end — attendance query ke liye
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ── WhatsApp Message Bhejo ──────────────────────────────────────────────────
const sendWhatsAppMsg = async (phone, message) => {
  try {
    const chatId = `91${phone}@c.us`; // India +91
    await waClient.sendMessage(chatId, message);
    console.log(`✅ WhatsApp sent to ${phone}`);
    return true;
  } catch (err) {
    console.error(`❌ WhatsApp failed for ${phone}:`, err.message);
    return false;
  }
};

// ── Checkout Reminder Cron — Har Minute Chalta Hai ─────────────────────────
const startCheckoutReminder = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const { start, end } = getTodayRange();

      // Aaj ke saare LoggedIn records + employee ka phone
      const loggedInRecords = await Attendance.find({
        date: { $gte: start, $lte: end },
        status: 'LoggedIn',
        checkOut: { $in: ['-', '--', null, ''] }
      }).populate('employee', 'name phone'); // ✅ User model se name + phone

      for (const record of loggedInRecords) {
        const emp = record.employee;

        // Phone nahi hai toh skip
        if (!emp?.phone) {
          console.log(`⚠️ Phone missing for ${emp?.name || 'unknown'}`);
          continue;
        }

        const checkInMins = timeStrToMinutes(record.checkIn);
        if (checkInMins === null) continue;

        const expectedMins = checkInMins + 8 * 60; // +8 ghante
        const expectedTimeStr = record.expectedCheckOut || minutesToTimeStr(expectedMins);

        // ✅ Exact checkout time pe reminder
        if (nowMins === expectedMins) {
          const message =
`✅ *Checkout Reminder* 🕐

Namaste *${emp.name}*! 🙏

Aapke *8 ghante* complete ho gaye hain!

⏰ *Check-In:* ${record.checkIn}
🕐 *Expected Checkout:* ${expectedTimeStr}

👉 App pe jaao aur *"Check Out & Mark Present"* button dabao.

Checkout nahi kiya toh attendance incomplete rahegi! ⚠️`;

          await sendWhatsAppMsg(emp.phone, message);
        }

        // ⚠️ 30 min baad bhi checkout nahi kiya — second reminder
        if (nowMins === expectedMins + 30) {
          const fresh = await Attendance.findById(record._id);
          if (fresh?.status === 'LoggedIn') {
            const lateMsg =
`⚠️ *Checkout Reminder (30 Min Late)*

Namaste *${emp.name}*!

Aapka checkout time *${expectedTimeStr}* tha — 30 minute ho gaye!

Abhi bhi checkout pending hai. Please abhi checkout karo! 🙏

👉 App kholo → *"Check Out & Mark Present"* dabao`;

            await sendWhatsAppMsg(emp.phone, lateMsg);
          }
        }
      }
    } catch (err) {
      console.error('❌ Cron error:', err.message);
    }
  });

  console.log('⏰ Checkout reminder cron started!');
};

// ── Manual Message Admin ke liye ───────────────────────────────────────────
const sendManualMsg = async (phone, message) => {
  return await sendWhatsAppMsg(phone, message);
};

// ── Initialize — server.js mein call karo ──────────────────────────────────
const initWhatsApp = () => {
  waClient.initialize();
  startCheckoutReminder();
};

module.exports = { initWhatsApp, sendManualMsg, sendWhatsAppMsg };