import { BaseService, NotFoundError } from './base.service.js'
import type { ChatSession, ChatMessage, Prisma, ChatStep, MessageRole } from '../database.js'

export interface CreateChatSessionData {
  sessionId: string
  userId?: string
  currentStep?: ChatStep
  selectedBrand?: string
  selectedPhones?: string[]
  preferences?: Record<string, any>
}

export interface UpdateChatSessionData {
  currentStep?: ChatStep
  selectedBrand?: string
  selectedPhones?: string[]
  preferences?: Record<string, any>
  isActive?: boolean
}

export interface CreateChatMessageData {
  chatSessionId: string
  role: MessageRole
  content: string
  metadata?: Record<string, any>
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

/**
 * Service class for chat session and message operations
 */
export class ChatService extends BaseService {
  /**
   * Create a new chat session
   */
  async createChatSession(data: CreateChatSessionData): Promise<ChatSession> {
    return this.execute(async () => {
      return this.db.chatSession.create({
        data: {
          sessionId: data.sessionId,
          userId: data.userId,
          currentStep: data.currentStep ?? 'BRAND_SELECTION',
          selectedBrand: data.selectedBrand,
          selectedPhones: data.selectedPhones ?? [],
          preferences: data.preferences,
          isActive: true,
        },
      })
    })
  }

  /**
   * Get chat session by session ID
   */
  async getChatSession(sessionId: string): Promise<ChatSession> {
    return this.execute(async () => {
      const session = await this.db.chatSession.findUnique({
        where: { sessionId },
      })

      if (!session) {
        throw new NotFoundError('ChatSession', sessionId)
      }

      return session
    })
  }

  /**
   * Get chat session with messages
   */
  async getChatSessionWithMessages(sessionId: string): Promise<ChatSessionWithMessages> {
    return this.execute(async () => {
      const session = await this.db.chatSession.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!session) {
        throw new NotFoundError('ChatSession', sessionId)
      }

      return session
    })
  }

  /**
   * Update chat session
   */
  async updateChatSession(sessionId: string, data: UpdateChatSessionData): Promise<ChatSession> {
    return this.execute(async () => {
      try {
        return await this.db.chatSession.update({
          where: { sessionId },
          data: {
            currentStep: data.currentStep,
            selectedBrand: data.selectedBrand,
            selectedPhones: data.selectedPhones,
            preferences: data.preferences,
            isActive: data.isActive,
          },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('ChatSession', sessionId)
          }
        }
        throw error
      }
    })
  }

  /**
   * Add message to chat session
   */
  async addMessage(data: CreateChatMessageData): Promise<ChatMessage> {
    return this.execute(async () => {
      return this.db.chatMessage.create({
        data: {
          chatSessionId: data.chatSessionId,
          role: data.role,
          content: data.content,
          metadata: data.metadata,
        },
      })
    })
  }

  /**
   * Get messages for a chat session
   */
  async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    return this.execute(async () => {
      const session = await this.db.chatSession.findUnique({
        where: { sessionId },
        select: { id: true },
      })

      if (!session) {
        throw new NotFoundError('ChatSession', sessionId)
      }

      return this.db.chatMessage.findMany({
        where: { chatSessionId: session.id },
        orderBy: { createdAt: 'asc' },
        take: limit,
      })
    })
  }

  /**
   * Get recent messages for a chat session
   */
  async getRecentMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    return this.execute(async () => {
      const session = await this.db.chatSession.findUnique({
        where: { sessionId },
        select: { id: true },
      })

      if (!session) {
        throw new NotFoundError('ChatSession', sessionId)
      }

      const messages = await this.db.chatMessage.findMany({
        where: { chatSessionId: session.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      // Return in chronological order
      return messages.reverse()
    })
  }

  /**
   * Delete chat session and all associated messages
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    return this.execute(async () => {
      try {
        await this.db.chatSession.delete({
          where: { sessionId },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            throw new NotFoundError('ChatSession', sessionId)
          }
        }
        throw error
      }
    })
  }

  /**
   * Get active chat sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<ChatSession[]> {
    return this.execute(async () => {
      return this.db.chatSession.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: { updatedAt: 'desc' },
      })
    })
  }

  /**
   * Deactivate old chat sessions
   */
  async deactivateOldSessions(olderThanDays: number = 7): Promise<number> {
    return this.execute(async () => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const result = await this.db.chatSession.updateMany({
        where: {
          updatedAt: { lt: cutoffDate },
          isActive: true,
        },
        data: { isActive: false },
      })

      return result.count
    })
  }

  /**
   * Get chat session statistics
   */
  async getChatSessionStats(): Promise<{
    totalSessions: number
    activeSessions: number
    completedSessions: number
    averageMessagesPerSession: number
  }> {
    return this.execute(async () => {
      const [totalSessions, activeSessions, completedSessions, messageStats] = await Promise.all([
        this.db.chatSession.count(),
        this.db.chatSession.count({ where: { isActive: true } }),
        this.db.chatSession.count({ where: { currentStep: 'COMPLETED' } }),
        this.db.chatMessage.aggregate({
          _avg: { chatSessionId: true },
          _count: { id: true },
        }),
      ])

      const sessionCount = await this.db.chatSession.count()
      const averageMessagesPerSession = sessionCount > 0 
        ? (messageStats._count.id || 0) / sessionCount 
        : 0

      return {
        totalSessions,
        activeSessions,
        completedSessions,
        averageMessagesPerSession,
      }
    })
  }
}