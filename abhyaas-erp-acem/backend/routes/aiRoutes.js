import express from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import rateLimit from 'express-rate-limit';
import { StudentNote, NoteChunk } from '../models/index.js';
import { 
  cleanExtractedText, 
  summarizeNotes, 
  generateQuiz, 
  explainTopic, 
  chatWithContext,
  extractTextFromImage
} from '../utils/aiService.js';
import { Student } from '../models/index.js';
import authenticateToken from '../middleware/authMiddleware.js'; // Corrected path

const router = express.Router();

// ─── SECURITY: Rate Limiting ──────────────────────────────────────────
const aiApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { success: false, message: 'Too many AI requests from this IP, please try again later.' }
});

// Apply rate limiter to all AI routes
router.use(aiApiLimiter);

// ─── SECURITY: Multer Config with Validation ──────────────────────────
const storage = multer.memoryStorage(); // Store in memory for immediate processing
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Image files are allowed.'));
    }
  }
});

// Middleware to catch Multer errors (e.g., file too large)
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// ─── Helper: Get Student Profile ─────────────────────────────────────
const getStudentProfile = async (req) => {
  const userId = req.user.id || req.user._id;
  // Try finding by user reference first
  let student = await Student.findOne({ user: userId });
  if (student) return student;
  // Safety fallback: Check if the user ID itself is the student profile ID
  student = await Student.findById(userId);
  return student;
};

// ─── Helper: Chunk Text ───────────────────────────────────────────────
function chunkText(text, maxChars = 2000) {
  const chunks = [];
  let currentIndex = 0;
  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxChars;
    // Try to break at a newline or period if possible
    if (endIndex < text.length) {
      let nextBreak = text.lastIndexOf('\\n', endIndex);
      if (nextBreak > currentIndex) {
        endIndex = nextBreak;
      } else {
        nextBreak = text.lastIndexOf('.', endIndex);
        if (nextBreak > currentIndex) endIndex = nextBreak + 1;
      }
    }
    chunks.push(text.slice(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }
  return chunks;
}

// ─── ROUTE: Upload & Process Notes (PDF) ─────────────────────────────
router.post('/process-notes', authenticateToken, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { title } = req.body;
    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();
      extractedText = result.text;
    } else if (req.file.mimetype.startsWith('image/')) {
      extractedText = await extractTextFromImage(req.file.buffer, req.file.mimetype);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid file type. Please upload a PDF or an Image.' });
    }

    // 1. Clean Text
    const cleanedText = cleanExtractedText(extractedText);
    if (!cleanedText) {
      return res.status(400).json({ success: false, message: 'Could not extract text from document.' });
    }

    // 2. Generate Summary
    // We summarize the first 5000 chars to save tokens on massive docs
    const summary = await summarizeNotes(cleanedText.substring(0, 5000));

    // 3. Save Document Metadata
    const student = await getStudentProfile(req);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const studentNote = new StudentNote({
      studentId: student._id, 
      title: title || req.file.originalname,
      summary: summary
    });
    const savedNote = await studentNote.save();

    // 4. Chunk Text and Save to DB (Chunk-based RAG Strategy)
    const chunks = chunkText(cleanedText);
    const chunkPromises = chunks.map((chunkText, index) => {
      const chunkDoc = new NoteChunk({
        noteId: savedNote._id,
        chunkIndex: index,
        text: chunkText
      });
      return chunkDoc.save();
    });
    await Promise.all(chunkPromises);

    res.json({
      success: true,
      message: 'Note processed securely.',
      data: {
        noteId: savedNote._id,
        title: savedNote.title,
        summary: savedNote.summary,
        totalChunks: chunks.length
      }
    });

  } catch (err) {
    console.error('Process notes error:', err);
    res.status(500).json({ success: false, message: 'Failed to process notes.' });
  }
});

// ─── ROUTE: Get Student's Saved Notes ─────────────────────────────────
router.get('/notes', authenticateToken, async (req, res) => {
  try {
    const student = await getStudentProfile(req);
    if (!student) return res.json({ success: true, data: [] });
    
    const notes = await StudentNote.find({ studentId: student._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notes.' });
  }
});

// ─── ROUTE: Chat with Notes (RAG) ────────────────────────────────────
router.post('/ask', authenticateToken, async (req, res) => {
  try {
    const { noteId, question, chatHistory } = req.body;
    
    // Sanitization measure (basic)
    if (!question || typeof question !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid question format.' });
    }

    let relevantChunks = [];
    if (noteId) {
      // Find chunks by text search (A simple RAG proxy before vector DB)
      // Extract keywords from question to find relevant chunks inside MongoDB
      const keywords = question.split(' ').filter(w => w.length > 3).join('|');
      
      let chunksQuery = { noteId };
      if (keywords) {
        // Simple regex search for relevancy. If no keywords hit, fallback to all chunks.
        chunksQuery.text = { $regex: keywords, $options: 'i' };
      }
      
      relevantChunks = await NoteChunk.find(chunksQuery).limit(3);
      
      // Fallback if keyword search returns nothing
      if (relevantChunks.length === 0) {
          relevantChunks = await NoteChunk.find({ noteId }).limit(3);
      }
    }

    const contextTexts = relevantChunks.map(c => c.text);
    const aiResponse = await chatWithContext(question, contextTexts, chatHistory);

    res.json({
      success: true,
      data: { response: aiResponse }
    });

  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ success: false, message: 'Error processing question.' });
  }
});

// ─── ROUTE: Explain Topic ─────────────────────────────────────────────
router.post('/explain', authenticateToken, async (req, res) => {
  try {
    const { topic, mode } = req.body;
    if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ success: false, message: 'A valid topic is required.' });
    }

    const explanation = await explainTopic(topic, mode);
    res.json({
      success: true,
      data: { explanation }
    });
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({ success: false, message: 'Error generating explanation.' });
  }
});

// ─── ROUTE: Generate Quiz ─────────────────────────────────────────────
router.post('/quiz', authenticateToken, async (req, res) => {
  try {
    const { topic, noteId } = req.body;
    
    let contextText = topic;
    if (noteId) {
        // Generate quiz from first few chunks of the note
        const chunks = await NoteChunk.find({ noteId }).limit(3);
        if (chunks.length > 0) {
            contextText = chunks.map(c => c.text).join('\\n\\n');
        }
    }

    if (!contextText) {
        return res.status(400).json({ success: false, message: 'Please provide a topic or select a note.' });
    }

    const quizData = await generateQuiz(contextText);
    res.json({
      success: true,
      data: quizData
    });

  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).json({ success: false, message: 'Error generating quiz.' });
  }
});

export default router;
