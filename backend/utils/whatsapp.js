// utils/whatsapp.js — Twilio WhatsApp notification helper
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

let client;
try {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio client initialised OK');
} catch (e) {
  console.error('❌ Twilio init failed:', e.message);
}

/**
 * Send a WhatsApp absence notification to a parent.
 * @param {string} parentPhone  - 10-digit phone number (e.g. "9876543210")
 * @param {string} studentName  - Full name of the student
 * @param {string} dateStr      - Human-readable date string (e.g. "17 Mar 2026")
 */
export async function sendAbsentNotification({ parentPhone, studentName, dateStr }) {
  if (!client) return { success: false, error: 'Twilio client not initialised' };

  // Sanitise — keep last 10 digits, prepend +91 for India
  const digits = parentPhone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    console.error(`❌ Invalid phone number: "${parentPhone}" (got ${digits.length} digits)`);
    return { success: false, error: `Invalid phone number: ${parentPhone}` };
  }

  const to   = `whatsapp:+91${digits}`;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  console.log(`📲 Sending WhatsApp -> to: ${to}  from: ${from}`);

  // Changed to user's custom text.
  // IMPORTANT: In the free Twilio Sandbox, freeform text like this only works
  // if the parent has sent a message to the sandbox number within the last 24 hours.
  // After 24 hours, Twilio will block this with Error 63016 unless a paid account and approved template are used.
  const body = `Dear parent , Your ward ${studentName} was absent for school on :${dateStr}.`;

  try {
    const msg = await client.messages.create({ from, to, body });
    console.log(`✅ WhatsApp sent! SID: ${msg.sid}  Status: ${msg.status}`);
    return { success: true, sid: msg.sid };
  } catch (e) {
    // Full Twilio error — error code tells us exactly what went wrong
    console.error(`❌ WhatsApp FAILED for ${to}`);
    console.error(`   Twilio Code: ${e.code}  HTTP Status: ${e.status}  Message: ${e.message}`);
    return { success: false, error: e.message, code: e.code };
  }
}
