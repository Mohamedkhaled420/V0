interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  type: "text" | "image"
  imageBase64?: string | null
  timestamp: Date
}

interface Conversation {
  id: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// In-memory storage (will reset on server restart)
// In production, replace with actual database
const conversations: Map<string, Conversation> = new Map()

export function createConversation(): string {
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const conversation: Conversation = {
    id,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  conversations.set(id, conversation)
  return id
}

export function getConversation(id: string): Conversation | null {
  return conversations.get(id) || null
}

export function addMessage(conversationId: string, message: Omit<Message, "id" | "timestamp">): Message {
  const conversation = conversations.get(conversationId)
  if (!conversation) {
    throw new Error("Conversation not found")
  }

  const newMessage: Message = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  }

  conversation.messages.push(newMessage)
  conversation.updatedAt = new Date()
  conversations.set(conversationId, conversation)

  return newMessage
}

export function getMessages(conversationId: string): Message[] {
  const conversation = conversations.get(conversationId)
  return conversation?.messages || []
}
