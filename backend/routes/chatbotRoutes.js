import express from 'express';
import { generateResponse } from '../utils/chatbotService.js';

const router = express.Router();

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string'
      });
    }

    // Generate AI response
    const aiResponse = await generateResponse(message, chatHistory);

    res.json({
      success: true,
      message: 'Response generated successfully',
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Chatbot route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response'
    });
  }
});

// GET /api/chatbot/health - for testing
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot service is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;