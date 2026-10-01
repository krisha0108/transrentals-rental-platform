// services/assistantService.js - Customer help assistant (AI chat)
import api from '../api';

const assistantService = {
  /**
   * Send the conversation so far and get the assistant's reply.
   * @param {{role: 'user'|'assistant', content: string}[]} messages
   * @param {string} [language] - reply language key, 'auto' to match the customer
   * @returns {Promise<{reply?: string, error?: string}>}
   */
  sendMessage: async (messages, language = 'auto') => {
    const response = await api.post(
      '/customer/help-chat',
      { messages, platform: 'app', language },
      { timeout: 60000 },
    );
    return response.data;
  },
};

export default assistantService;
