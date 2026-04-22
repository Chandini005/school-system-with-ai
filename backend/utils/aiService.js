import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here')
  ? new GoogleGenerativeAI(GEMINI_KEY)
  : null;

/**
 * 0. OCR / Image to Text
 * Uses Gemini Vision capabilities to extract text from images.
 */
export async function extractTextFromImage(buffer, mimeType) {
  if (!genAI) throw new Error('Gemini API is not configured.');
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  try {
    const result = await model.generateContent([
      "Extract all text from this image. Return only the extracted text, no commentary.",
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType
        }
      }
    ]);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error('Gemini OCR Error:', err.message);
    throw new Error('Failed to extract text from image.');
  }
}

/**
 * 1. Text Cleaning
 * Removes extra spaces, garbage characters, and normalizes text for better AI processing.
 */
export function cleanExtractedText(text) {
  if (!text) return '';
  return text
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters EXCEPT newlines
    .replace(/\s+/g, ' ')          // Collapse multiple spaces/newlines into a single space
    .trim();                       // Remove leading/trailing spaces
}

/**
 * 2. Summarize Notes
 * Generates a structured summary of the provided text chunk.
 */
export async function summarizeNotes(text) {
  if (!genAI) throw new Error('Gemini API is not configured.');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const prompt = `
    You are an expert educational summarizer.
    Summarize the following text notes. Provide:
    1. A short high-level overview.
    2. Key bullet points of the most important concepts.
    
    Text to summarize:
    """
    ${text}
    """
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('Gemini Summarization Error:', err.message);
    throw new Error('AI was unable to summarize these notes. Please try again.');
  }
}

/**
 * 3. Generate Quiz
 * Generates MCQs and Short Answer questions based on a topic or text context.
 */
export async function generateQuiz(topicOrText) {
  if (!genAI) throw new Error('Gemini API is not configured.');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  const prompt = `
    You are an expert teacher. Generate a quiz based on the following topic or text.
    Create exactly 3 Multiple Choice Questions (with options A, B, C, D) and 2 Short Answer Questions.
    Provide the output strictly in a JSON array format (no markdown code blocks, just raw JSON).
    
    Format example:
    [
      { "type": "mcq", "question": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..." },
      { "type": "short", "question": "...", "answer": "...", "explanation": "..." }
    ]

    Topic/Text:
    """
    ${topicOrText}
    """
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean markdown if present
    if (text.startsWith('```json')) {
      text = text.slice(7, -3).trim();
    } else if (text.startsWith('```')) {
      text = text.slice(3, -3).trim();
    }
    
    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini Quiz Error:', err.message);
    throw new Error('Failed to generate a valid quiz. Please try again.');
  }
}

/**
 * 4. Topic-Based Learning (Explain Topic)
 * Explains a topic based on dynamic modes (Simple, Teacher, Explain like I'm 10).
 */
export async function explainTopic(topic, mode = 'Simple') {
  if (!genAI) throw new Error('Gemini API is not configured.');
  
  let systemInstruction = "You are a helpful AI tutor.";
  if (mode === 'Teacher') {
    systemInstruction = "You are a formal, academic teacher. Explain the concept with precise terminology, definitions, and realistic academic examples.";
  } else if (mode === 'Simple') {
    systemInstruction = "You are a friendly tutor. Explain the concept in simple, easy-to-understand language. Keep it engaging.";
  } else if (mode === 'Explain like I\'m 10') {
    systemInstruction = "You are explaining this to a 10-year-old. Use extremely simple language, super fun analogies (like video games, superheroes, or toys), and keep it short and exciting!";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction
    });
    
    const result = await model.generateContent(`Please explain: ${topic}`);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('Gemini Explanation Error:', err.message);
    throw new Error('AI was unable to explain this topic right now.');
  }
}

/**
 * 5. Chunk-based RAG Chat Context
 * Answers user questions using the provided context chunks.
 */
export async function chatWithContext(userMessage, contextChunks, chatHistory = []) {
  if (!genAI) throw new Error('Gemini API is not configured.');
  
  const systemInstruction = `
    You are an AI study assistant.
    You must answer the user's question primarily using the provided "Context Notes".
    If the Context Notes do not contain the answer, you can use your general knowledge, but mention that it's outside the provided notes.
    Keep your answers clear and educational.
    
    Context Notes:
    """
    ${contextChunks.join('\n\n---\n\n')}
    """
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction
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
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('Gemini Chat Error:', err.message);
    throw new Error('AI assistant is currently unreachable.');
  }
}
