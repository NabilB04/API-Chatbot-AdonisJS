import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import Conversation from '#models/conversation'
import Message from '#models/message'
import ChatbotService from '#services/chatbot_service'
import { questionValidator } from '#validators/question_validator'
import { randomUUID } from 'node:crypto'

export default class ConversationsController {
  private chatbotService = new ChatbotService()

  // POST questions
  async sendQuestion({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(questionValidator)

      let sessionId = payload.session_id || randomUUID()

      // Create conversation
      let conversation = await Conversation.findBy('session_id', sessionId)
      if (!conversation) {
        conversation = await Conversation.create({
          sessionId: sessionId
        })
      }

      // Save user message
      await Message.create({
        conversationId: conversation.id,
        senderType: 'user',
        message: payload.question
      })

      // Call external API
      const botResponse = await this.chatbotService.sendMessage(payload.question, sessionId)

      let botMessage = 'No response from bot'
      let suggestLinks = []

      if (botResponse?.data?.message?.[0]) {
        botMessage = botResponse.data.message[0].text || 'No response from bot'
        suggestLinks = botResponse.data.message[0].suggest_links || []
      }

      // Save bot response
      await Message.create({
        conversationId: conversation.id,
        senderType: 'bot',
        message: botMessage
      })

      // Update conversation last message time
      conversation.lastMessageAt = DateTime.now()
      await conversation.save()

      return response.json({
        success: true,
        data: {
          session_id: sessionId,
          question: payload.question,
          answer: botMessage,
          suggest_links: suggestLinks
        }
      })
    } catch (error) {
      console.error('Send Question Error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to process question',
        error: error.message
      })
    }
  }

  // GET /conversation
  async getAllConversations({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const sessionId = request.input('session_id')

      let query = Conversation.query()
        .preload('messages')
        .orderBy('updated_at', 'desc')

      if (sessionId) {
        query = query.where('session_id', sessionId)
      }

      const conversations = await query.paginate(page, limit)

      return response.json({
        success: true,
        data: conversations
      })
    } catch (error) {
      console.error('Get All Conversations Error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
        error: error.message
      })
    }
  }

  // GET /conversation/:id_or_uuid
  async getConversation({ params, response }: HttpContext) {
    try {
      const identifier = params.id_or_uuid

      let conversation
      if (isNaN(identifier)) {
        conversation = await Conversation.query()
          .where('session_id', identifier)
          .preload('messages', (query) => {
            query.orderBy('created_at', 'asc')
          })
          .first()
      } else {
        conversation = await Conversation.query()
          .where('id', identifier)
          .preload('messages', (query) => {
            query.orderBy('created_at', 'asc')
          })
          .first()
      }

      if (!conversation) {
        return response.status(404).json({
          success: false,
          message: 'Conversation not found'
        })
      }

      return response.json({
        success: true,
        data: conversation
      })
    } catch (error) {
      console.error('Get Conversation Error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch conversation',
        error: error.message
      })
    }
  }

  // DELETE /conversation/:id 
  async deleteConversation({ params, response }: HttpContext) {
    try {
      const conversation = await Conversation.find(params.id)

      if (!conversation) {
        return response.status(404).json({
          success: false,
          message: 'Conversation not found'
        })
      }

      await conversation.delete()

      return response.json({
        success: true,
        message: 'Conversation deleted successfully'
      })
    } catch (error) {
      console.error('Delete Conversation Error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to delete conversation',
        error: error.message
      })
    }
  }
}
