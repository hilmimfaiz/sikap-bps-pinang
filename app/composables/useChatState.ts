import { useState } from '#app'

export const useChatState = () => {
  const isOpen = useState('chat_is_open', () => false)
  const activeConversation = useState<any>('chat_active_conversation', () => null)
  const messages = useState<any[]>('chat_messages', () => [])
  
  // --- TAMBAHAN: State untuk menyimpan pesan yang sedang di-reply ---
  const replyingTo = useState<any>('chat_replying_to', () => null)

  const toggleChat = () => {
    isOpen.value = !isOpen.value
  }

  const setConversation = (conversation: any) => {
    activeConversation.value = conversation
    // Reset reply saat ganti percakapan
    replyingTo.value = null 
  }

  // --- TAMBAHAN: Helper actions ---
  const setReplyTo = (message: any) => {
    replyingTo.value = message
  }

  const cancelReply = () => {
    replyingTo.value = null
  }

  return {
    isOpen,
    activeConversation,
    messages,
    replyingTo,     // Export state
    setReplyTo,     // Export action
    cancelReply,    // Export action
    toggleChat,
    setConversation
  }
}