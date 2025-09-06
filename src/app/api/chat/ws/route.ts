import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { aiService } from '../../../../services/ai.js';
import { ChatContext, ChatMessage, ChatStep } from '../../../../types/chat.js';
import { v4 as uuidv4 } from 'uuid';

// WebSocket connection management
const connections = new Map<string, any>();
const chatSessions = new Map<string, ChatContext>();

/**
 * WebSocket upgrade handler for real-time chat
 */
export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // Create WebSocket server
    const wss = new WebSocketServer({ noServer: true });
    
    // Handle WebSocket upgrade
    const { socket, response } = await upgradeWebSocket(request);
    
    if (!socket) {
      return new Response('WebSocket upgrade failed', { status: 500 });
    }

    // Generate session ID
    const sessionId = uuidv4();
    
    // Initialize chat context
    const chatContext: ChatContext = {
      sessionId,
      userId: undefined,
      conversationHistory: [],
      currentStep: 'brand_selection',
      selectedBrand: undefined,
      selectedPhones: [],
      preferences: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store session
    chatSessions.set(sessionId, chatContext);
    connections.set(sessionId, socket);
    
    // Send welcome message
    const welcomeMessage = {
      type: 'message',
      data: {
        id: uuidv4(),
        role: 'assistant',
        content: 'Hello! I\'m here to help you compare phones. Which brand are you interested in?',
        timestamp: new Date(),
        sessionId,
      },
    };
    
    socket.send(JSON.stringify(welcomeMessage));
    
    // Handle incoming messages
    socket.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(sessionId, message, socket);
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({
          type: 'error',
          data: {
            code: 'MESSAGE_PROCESSING_ERROR',
            message: 'Failed to process message',
          },
        }));
      }
    });
    
    // Handle connection close
    socket.on('close', () => {
      connections.delete(sessionId);
      chatSessions.delete(sessionId);
      console.log(`WebSocket connection closed: ${sessionId}`);
    });
    
    // Handle errors
    socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      connections.delete(sessionId);
      chatSessions.delete(sessionId);
    });
    
    console.log(`WebSocket connection established: ${sessionId}`);
    
    return response;
  } catch (error) {
    console.error('WebSocket setup error:', error);
    return new Response('WebSocket setup failed', { status: 500 });
  }
}

/**
 * Handle incoming WebSocket messages
 */
async function handleWebSocketMessage(
  sessionId: string,
  message: any,
  socket: any
) {
  const chatContext = chatSessions.get(sessionId);
  
  if (!chatContext) {
    socket.send(JSON.stringify({
      type: 'error',
      data: {
        code: 'SESSION_NOT_FOUND',
        message: 'Chat session not found',
      },
    }));
    return;
  }
  
  try {
    switch (message.type) {
      case 'chat_message':
        await handleChatMessage(sessionId, message.data, socket, chatContext);
        break;
        
      case 'typing_start':
        // Broadcast typing indicator to other clients (if needed)
        break;
        
      case 'typing_stop':
        // Stop typing indicator
        break;
        
      case 'ping':
        socket.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        socket.send(JSON.stringify({
          type: 'error',
          data: {
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: `Unknown message type: ${message.type}`,
          },
        }));
    }
  } catch (error) {
    console.error('Message handling error:', error);
    socket.send(JSON.stringify({
      type: 'error',
      data: {
        code: 'MESSAGE_HANDLING_ERROR',
        message: 'Failed to handle message',
      },
    }));
  }
}

/**
 * Handle chat messages
 */
async function handleChatMessage(
  sessionId: string,
  messageData: any,
  socket: any,
  chatContext: ChatContext
) {
  const { content } = messageData;
  
  if (!content || typeof content !== 'string') {
    socket.send(JSON.stringify({
      type: 'error',
      data: {
        code: 'INVALID_MESSAGE',
        message: 'Message content is required',
      },
    }));
    return;
  }
  
  // Send typing indicator
  socket.send(JSON.stringify({
    type: 'typing_start',
    data: { role: 'assistant' },
  }));
  
  try {
    // Process message with AI service
    const aiResponse = await aiService.instance.processUserMessage(content, chatContext);
    
    // Update chat context
    const updatedContext = {
      ...chatContext,
      conversationHistory: [
        ...chatContext.conversationHistory,
        {
          id: uuidv4(),
          role: 'user' as const,
          content,
          timestamp: new Date(),
        },
        {
          id: uuidv4(),
          role: 'assistant' as const,
          content: aiResponse.message,
          timestamp: new Date(),
        },
      ],
      currentStep: aiResponse.nextStep || chatContext.currentStep,
      updatedAt: new Date(),
    };
    
    // Update stored context
    chatSessions.set(sessionId, updatedContext);
    
    // Stop typing indicator
    socket.send(JSON.stringify({
      type: 'typing_stop',
      data: { role: 'assistant' },
    }));
    
    // Send AI response
    socket.send(JSON.stringify({
      type: 'message',
      data: {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date(),
        sessionId,
        suggestions: aiResponse.suggestions,
        nextStep: aiResponse.nextStep,
        extractedData: aiResponse.extractedData,
      },
    }));
    
    // Send context update if step changed
    if (aiResponse.nextStep && aiResponse.nextStep !== chatContext.currentStep) {
      socket.send(JSON.stringify({
        type: 'context_update',
        data: {
          currentStep: aiResponse.nextStep,
          selectedBrand: updatedContext.selectedBrand,
          selectedPhones: updatedContext.selectedPhones,
        },
      }));
    }
    
  } catch (error) {
    console.error('AI processing error:', error);
    
    // Stop typing indicator
    socket.send(JSON.stringify({
      type: 'typing_stop',
      data: { role: 'assistant' },
    }));
    
    // Send error response
    socket.send(JSON.stringify({
      type: 'message',
      data: {
        id: uuidv4(),
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble processing your request right now. Please try again.',
        timestamp: new Date(),
        sessionId,
      },
    }));
  }
}

/**
 * Upgrade HTTP request to WebSocket
 * Note: This is a simplified implementation. In production, you might want to use
 * a more robust WebSocket library or framework.
 */
async function upgradeWebSocket(request: NextRequest): Promise<{
  socket: any;
  response: Response;
}> {
  // This is a placeholder implementation
  // In a real Next.js application, you would typically use a WebSocket library
  // or deploy to a platform that supports WebSocket upgrades
  
  throw new Error('WebSocket upgrade not implemented in this environment');
}

/**
 * Broadcast message to all connected clients
 */
function broadcastMessage(message: any, excludeSessionId?: string) {
  connections.forEach((socket, sessionId) => {
    if (sessionId !== excludeSessionId) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Broadcast error:', error);
        // Remove dead connection
        connections.delete(sessionId);
        chatSessions.delete(sessionId);
      }
    }
  });
}

/**
 * Get active connection count
 */
export function getActiveConnectionCount(): number {
  return connections.size;
}

/**
 * Get active chat sessions
 */
export function getActiveChatSessions(): ChatContext[] {
  return Array.from(chatSessions.values());
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions() {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  chatSessions.forEach((context, sessionId) => {
    if (now.getTime() - context.updatedAt.getTime() > maxAge) {
      chatSessions.delete(sessionId);
      const connection = connections.get(sessionId);
      if (connection) {
        connection.close();
        connections.delete(sessionId);
      }
    }
  });
}

// Clean up expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);