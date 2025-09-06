import { describe, it, expect, beforeEach } from 'vitest'
import { ChatService, NotFoundError } from '../services/index.js'
import { testDb, createTestChatSession } from './setup.js'

describe('ChatService', () => {
  let chatService: ChatService

  beforeEach(() => {
    chatService = new ChatService()
  })

  describe('createChatSession', () => {
    it('should create a new chat session successfully', async () => {
      const sessionData = createTestChatSession()
      const session = await chatService.createChatSession(sessionData)

      expect(session).toMatchObject({
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        currentStep: sessionData.currentStep,
        selectedBrand: sessionData.selectedBrand,
        selectedPhones: sessionData.selectedPhones,
        isActive: sessionData.isActive,
      })
      expect(session.id).toBeDefined()
      expect(session.createdAt).toBeDefined()
    })

    it('should set default values correctly', async () => {
      const sessionData = {
        sessionId: 'test-session-123',
      }
      const session = await chatService.createChatSession(sessionData)

      expect(session.currentStep).toBe('BRAND_SELECTION')
      expect(session.selectedPhones).toEqual([])
      expect(session.isActive).toBe(true)
    })
  })

  describe('getChatSession', () => {
    it('should return chat session by sessionId', async () => {
      const created = await testDb.chatSession.create({ data: createTestChatSession() })
      const session = await chatService.getChatSession(created.sessionId)

      expect(session).toMatchObject(created)
    })

    it('should throw NotFoundError for non-existent sessionId', async () => {
      await expect(chatService.getChatSession('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getChatSessionWithMessages', () => {
    it('should return chat session with messages', async () => {
      const created = await testDb.chatSession.create({ data: createTestChatSession() })
      
      // Add some messages
      await testDb.chatMessage.create({
        data: {
          chatSessionId: created.id,
          role: 'USER',
          content: 'Hello',
        },
      })
      await testDb.chatMessage.create({
        data: {
          chatSessionId: created.id,
          role: 'ASSISTANT',
          content: 'Hi there!',
        },
      })

      const session = await chatService.getChatSessionWithMessages(created.sessionId)

      expect(session.messages).toHaveLength(2)
      expect(session.messages[0].role).toBe('USER')
      expect(session.messages[1].role).toBe('ASSISTANT')
    })

    it('should return messages in chronological order', async () => {
      const created = await testDb.chatSession.create({ data: createTestChatSession() })
      
      const message1 = await testDb.chatMessage.create({
        data: {
          chatSessionId: created.id,
          role: 'USER',
          content: 'First message',
        },
      })
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const message2 = await testDb.chatMessage.create({
        data: {
          chatSessionId: created.id,
          role: 'ASSISTANT',
          content: 'Second message',
        },
      })

      const session = await chatService.getChatSessionWithMessages(created.sessionId)

      expect(session.messages[0].content).toBe('First message')
      expect(session.messages[1].content).toBe('Second message')
    })
  })

  describe('updateChatSession', () => {
    it('should update chat session successfully', async () => {
      const created = await testDb.chatSession.create({ data: createTestChatSession() })
      const updateData = {
        currentStep: 'MODEL_SELECTION' as const,
        selectedBrand: 'apple',
        selectedPhones: ['phone1', 'phone2'],
      }
      
      const updated = await chatService.updateChatSession(created.sessionId, updateData)

      expect(updated.currentStep).toBe(updateData.currentStep)
      expect(updated.selectedBrand).toBe(updateData.selectedBrand)
      expect(updated.selectedPhones).toEqual(updateData.selectedPhones)
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime())
    })

    it('should throw NotFoundError for non-existent sessionId', async () => {
      await expect(
        chatService.updateChatSession('non-existent', { currentStep: 'COMPARISON' })
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('addMessage', () => {
    it('should add message to chat session', async () => {
      const session = await testDb.chatSession.create({ data: createTestChatSession() })
      
      const messageData = {
        chatSessionId: session.id,
        role: 'USER' as const,
        content: 'Test message',
        metadata: { timestamp: Date.now() },
      }
      
      const message = await chatService.addMessage(messageData)

      expect(message).toMatchObject({
        chatSessionId: messageData.chatSessionId,
        role: messageData.role,
        content: messageData.content,
        metadata: messageData.metadata,
      })
      expect(message.id).toBeDefined()
      expect(message.createdAt).toBeDefined()
    })
  })

  describe('getMessages', () => {
    it('should return messages for a chat session', async () => {
      const session = await testDb.chatSession.create({ data: createTestChatSession() })
      
      await testDb.chatMessage.create({
        data: { chatSessionId: session.id, role: 'USER', content: 'Message 1' },
      })
      await testDb.chatMessage.create({
        data: { chatSessionId: session.id, role: 'ASSISTANT', content: 'Message 2' },
      })

      const messages = await chatService.getMessages(session.sessionId)

      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('Message 1')
      expect(messages[1].content).toBe('Message 2')
    })

    it('should limit messages when limit is specified', async () => {
      const session = await testDb.chatSession.create({ data: createTestChatSession() })
      
      // Create 5 messages
      for (let i = 1; i <= 5; i++) {
        await testDb.chatMessage.create({
          data: { chatSessionId: session.id, role: 'USER', content: `Message ${i}` },
        })
      }

      const messages = await chatService.getMessages(session.sessionId, 3)

      expect(messages).toHaveLength(3)
    })

    it('should throw NotFoundError for non-existent sessionId', async () => {
      await expect(chatService.getMessages('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getRecentMessages', () => {
    it('should return recent messages in chronological order', async () => {
      const session = await testDb.chatSession.create({ data: createTestChatSession() })
      
      // Create messages with slight delays to ensure different timestamps
      for (let i = 1; i <= 3; i++) {
        await testDb.chatMessage.create({
          data: { chatSessionId: session.id, role: 'USER', content: `Message ${i}` },
        })
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const messages = await chatService.getRecentMessages(session.sessionId, 2)

      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('Message 2') // Second most recent
      expect(messages[1].content).toBe('Message 3') // Most recent
    })
  })

  describe('deleteChatSession', () => {
    it('should delete chat session and associated messages', async () => {
      const session = await testDb.chatSession.create({ data: createTestChatSession() })
      
      await testDb.chatMessage.create({
        data: { chatSessionId: session.id, role: 'USER', content: 'Test message' },
      })

      await chatService.deleteChatSession(session.sessionId)

      // Verify session is deleted
      await expect(chatService.getChatSession(session.sessionId)).rejects.toThrow(NotFoundError)
      
      // Verify messages are also deleted (cascade)
      const messages = await testDb.chatMessage.findMany({
        where: { chatSessionId: session.id },
      })
      expect(messages).toHaveLength(0)
    })

    it('should throw NotFoundError for non-existent sessionId', async () => {
      await expect(chatService.deleteChatSession('non-existent')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getUserActiveSessions', () => {
    it('should return active sessions for a user', async () => {
      const userId = 'test-user-123'
      
      await testDb.chatSession.create({ 
        data: createTestChatSession({ userId, isActive: true }) 
      })
      await testDb.chatSession.create({ 
        data: createTestChatSession({ userId, isActive: false, sessionId: 'inactive-session' }) 
      })
      await testDb.chatSession.create({ 
        data: createTestChatSession({ userId: 'other-user', sessionId: 'other-user-session' }) 
      })

      const sessions = await chatService.getUserActiveSessions(userId)

      expect(sessions).toHaveLength(1)
      expect(sessions[0].userId).toBe(userId)
      expect(sessions[0].isActive).toBe(true)
    })
  })

  describe('deactivateOldSessions', () => {
    it('should deactivate sessions older than specified days', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days ago

      // Create old session
      const oldSession = await testDb.chatSession.create({ 
        data: {
          ...createTestChatSession({ sessionId: 'old-session' }),
          createdAt: oldDate,
          updatedAt: oldDate,
        }
      })
      
      // Create recent session
      await testDb.chatSession.create({ 
        data: createTestChatSession({ sessionId: 'recent-session' }) 
      })

      const deactivatedCount = await chatService.deactivateOldSessions(7)

      expect(deactivatedCount).toBe(1)
      
      // Verify old session is deactivated
      const updatedOldSession = await testDb.chatSession.findUnique({
        where: { id: oldSession.id },
      })
      expect(updatedOldSession?.isActive).toBe(false)
    })
  })

  describe('getChatSessionStats', () => {
    it('should return correct statistics', async () => {
      // Create test data
      const session1 = await testDb.chatSession.create({ 
        data: createTestChatSession({ currentStep: 'COMPLETED' }) 
      })
      const session2 = await testDb.chatSession.create({ 
        data: createTestChatSession({ sessionId: 'session-2', isActive: true }) 
      })
      const session3 = await testDb.chatSession.create({ 
        data: createTestChatSession({ sessionId: 'session-3', isActive: false }) 
      })

      // Add messages
      await testDb.chatMessage.create({
        data: { chatSessionId: session1.id, role: 'USER', content: 'Message 1' },
      })
      await testDb.chatMessage.create({
        data: { chatSessionId: session1.id, role: 'ASSISTANT', content: 'Message 2' },
      })
      await testDb.chatMessage.create({
        data: { chatSessionId: session2.id, role: 'USER', content: 'Message 3' },
      })

      const stats = await chatService.getChatSessionStats()

      expect(stats.totalSessions).toBe(3)
      expect(stats.activeSessions).toBe(1)
      expect(stats.completedSessions).toBe(1)
      expect(stats.averageMessagesPerSession).toBe(1) // 3 messages / 3 sessions
    })
  })
})