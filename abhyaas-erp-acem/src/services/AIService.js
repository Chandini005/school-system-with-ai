const API_BASE_URL = '/api';

class AIService {
  /**
   * Send a message to the AI chatbot and receive a response.
   * @param {string} message - The user's message
   * @param {Array}  chatHistory - Recent messages for context (up to 12)
   * @returns {Promise<{response: string, timestamp: string}>}
   */
  static async sendMessage(message, chatHistory = []) {
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatHistory }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to get response');
      }

      return data.data; // { response, timestamp }
    } catch (error) {
      console.warn('[AIService] Request failed:', error.message);
      // Return the spec-defined fallback message
      return {
        response: "I'm Abhyaas Assistant. How can I help you?",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Health check for the chatbot service.
   */
  static async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/health`);
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }
}

export default AIService;