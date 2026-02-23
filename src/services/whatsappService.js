// ============================================================
// backend/services/whatsappService.js
// Meta WhatsApp Cloud API Version (No Ban, No QR)
// Install: npm install axios node-cron
// ============================================================

const axios = require('axios');
const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ================= CONFIG =================
const WHATSAPP_TOKEN = process.env.WA_TOKEN;
const PHONE_NUMBER_ID = process.env.WA_PHONE_ID;

// ── Helpers ───────────────────────────────
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

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ── SEND WHATSAPP (Meta API) ───────────────────────────────
const sendWhatsAppMsg = async (phone, message) => {
  try {
    const cleanPhone = phone.replace(/\D/g, ''); // remove spaces

    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp sent to ${phone}`);
    return true;
  } catch (err) {
    console.error(`❌ WhatsApp failed for ${phone}:`, err.response?.data || err.message);
    return false;
  }
};

// ── Checkout Reminder Cron ───────────────────────────────
const startCheckoutReminder = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const { start, end } = getTodayRange();

      const loggedInRecords = await Attendance.find({
        date: { $gte: start, $lte: end },
        status: 'LoggedIn',
        checkOut: { $in: ['-', '--', null, ''] }
      }).populate('employee', 'name phone');

      for (const record of loggedInRecords) {
        const emp = record.employee;
        if (!emp?.phone) continue;

        const checkInMins = timeStrToMinutes(record.checkIn);
        if (checkInMins === null) continue;

        const expectedMins = checkInMins + 8 * 60;
        const expectedTimeStr =
          record.expectedCheckOut || minutesToTimeStr(expectedMins);

        // ⏰ Exact time reminder
        if (nowMins === expectedMins) {
          const message =
`Checkout Reminder

Namaste ${emp.name} 🙏

Aapke 8 ghante complete ho gaye hain.

Check-In: ${record.checkIn}
Expected Checkout: ${expectedTimeStr}

App pe jaakar "Check Out" karein.`;

          await sendWhatsAppMsg(emp.phone, message);
        }

        // ⚠️ 30 min late reminder
        if (nowMins === expectedMins + 30) {
          const fresh = await Attendance.findById(record._id);
          if (fresh?.status === 'LoggedIn') {
            const lateMsg =
`Late Checkout Reminder

Namaste ${emp.name},

Aapka checkout time ${expectedTimeStr} tha.
30 minute ho chuke hain.

Kripya turant checkout karein.`;

            await sendWhatsAppMsg(emp.phone, lateMsg);
          }
        }
      }
    } catch (err) {
      console.error('❌ Cron error:', err.message);
    }
  });

  console.log('⏰ Checkout reminder cron started (Cloud API)');
};

// ── Manual Message
const sendManualMsg = async (phone, message) => {
  return await sendWhatsAppMsg(phone, message);
};

// ── INIT
const initWhatsApp = () => {
  startCheckoutReminder();
};

module.exports = {
  initWhatsApp,
  sendManualMsg,
  sendWhatsAppMsg
};
