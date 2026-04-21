import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Initialise Gemini only when a real key is provided ─────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here')
  ? new GoogleGenerativeAI(GEMINI_KEY)
  : null;

// ─── System prompt for ABHYAAS context ──────────────────────────────
const SYSTEM_PROMPT = `
You are ABHYAAS AI, a smart and helpful virtual assistant for the ABHYAAS School Management ERP System.

You are a FULL AI assistant — not limited to ERP topics. You can:
1. Answer ANY general knowledge or educational questions.
2. Explain scientific, mathematical, or programming concepts.
3. Help with writing, summarising, or brainstorming.
4. Engage in friendly, helpful conversation.

When relevant, guide users to specific ABHYAAS features:
- Student / Teacher Profiles & Attendance
- Fee Collection & Invoicing
- Academic Marks & Exam Results
- Inventory & Payroll management
- Principal Insights Dashboard

Always maintain a professional, supportive, and school-appropriate tone.
If you cannot access a user's private data, politely direct them to the relevant dashboard section or suggest contacting school administration.
`.trim();

// ─── Main export: generate AI response ──────────────────────────────
async function generateResponse(userMessage, chatHistory = []) {
  if (!genAI) {
    console.warn('[Chatbot] GEMINI_API_KEY missing or placeholder — using fallback response.');
    return getFallbackResponse(userMessage);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build the conversation history in Gemini format
    const history = chatHistory
      .filter(m => m && m.message && m.sender)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.message }],
      }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 700,
        temperature: 0.75,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('[Chatbot] Gemini API error:', error.message);
    return getFallbackResponse(userMessage);
  }
}

// ─── Fallback when Gemini is unavailable ────────────────────────────
function getFallbackResponse(userMessage) {
  const msg = (userMessage || '').toLowerCase();

  if (msg.includes('login') || msg.includes('password') || msg.includes('forgot')) {
    return "To log in, use your student/teacher ID provided by the administration. If you've forgotten your password, click 'Forgot Password?' on the login page to reset it via OTP.";
  }
  if (msg.includes('fee') || msg.includes('payment') || msg.includes('invoice')) {
    return "You can view and pay your fees in the 'Fees' section of your dashboard. It includes tuition, transport, and other school charges.";
  }
  if (msg.includes('attendance')) {
    return "Attendance is updated daily by teachers. Check the 'Attendance' widget on your dashboard to see your percentage and history.";
  }
  if (msg.includes('exam') || msg.includes('result') || msg.includes('marks') || msg.includes('grade')) {
    return "Check the 'Examinations' section for upcoming schedules and 'Exam Marks' to view your performance results.";
  }
  if (msg.includes('timetable') || msg.includes('schedule') || msg.includes('class')) {
    return "Your class timetable is available in the 'Timetable' section of your dashboard.";
  }
  if (msg.includes('inventory') || msg.includes('stock')) {
    return "The inventory module tracks all school assets and supplies. Admins can view and manage items under the 'Inventory' section.";
  }

  // Default fallback — as specified
  return "I'm Abhyaas Assistant. How can I help you?";
}

export { generateResponse, getFallbackResponse };