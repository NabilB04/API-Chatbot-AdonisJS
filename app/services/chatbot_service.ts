import { randomUUID } from 'node:crypto'

export default class ChatbotService {
  private apiUrl = 'https://api.majadigidev.jatimprov.go.id/api/external/chatbot/send-message'

  async sendMessage(message: string, sessionId?: string): Promise<any> {
    try {
      const payload = {
        question: message,
        additional_context: "",
        session_id: sessionId || randomUUID()
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('External API Error:', error)
      throw new Error('Failed to get response from chatbot service')
    }
  }
}
