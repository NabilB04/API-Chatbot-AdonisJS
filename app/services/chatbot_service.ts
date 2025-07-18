import { randomUUID } from 'node:crypto'
import axios from 'axios'

export default class ChatbotService {
  private apiUrl = 'https://api.majadigidev.jatimprov.go.id/api/external/chatbot/send-message'

  async sendMessage(message: string, sessionId?: string): Promise<any> {
    try {
      const payload = {
        question: message,
        additional_context: "",
        session_id: sessionId || randomUUID()
      }

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      return response.data
    } catch (error) {
      console.error('External API Error:', error)
      throw new Error('Failed to get response from chatbot service')
    }
  }
}
