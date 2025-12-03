<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'

// --- COMPOSABLES ---
const { playNotificationSound } = useSound()
const { 
  isOpen, 
  toggleChat, 
  activeConversation, 
  messages, 
  setConversation,
  replyingTo,
  setReplyTo,
  cancelReply
} = useChatState()

const userCookie = useCookie<any>('user_data')
const currentUser = userCookie.value
const { t } = useI18n()
const toast = useToast()

// --- STATE ---
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const isSending = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const showContacts = ref(false)
const contacts = ref<any[]>([])
const conversations = ref<any[]>([])
let pollingInterval: NodeJS.Timer | null = null

// --- STATE MODAL HAPUS ---
const showDeleteConfirm = ref(false)
const msgToDelete = ref<any>(null)

// --- COMPUTED: TOTAL UNREAD (Badge Merah Utama) ---
const totalUnread = computed(() => {
  return conversations.value.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
})

// --- SCROLLING ---
const scrollToBottom = async (smooth = true) => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }
}

// --- DATA FETCHING ---
const fetchConversations = async () => {
  try {
    const data: any = await $fetch('/api/chat/conversations')
    conversations.value = data || []
  } catch (e) { console.error(e) }
}

const fetchContacts = async () => {
  try {
    const data: any = await $fetch('/api/chat/contacts')
    contacts.value = data || []
  } catch (e) { console.error(e) }
}

const fetchMessages = async () => {
  if (!activeConversation.value?.partnerId) return
  try {
    const data: any = await $fetch('/api/chat/messages', {
      query: { partnerId: activeConversation.value.partnerId }
    })
    
    const lastLocalMsg = messages.value[messages.value.length - 1]
    const lastServerMsg = data[data.length - 1]

    if (data.length !== messages.value.length || lastLocalMsg?.id !== lastServerMsg?.id) {
      const isAtBottom = messagesContainer.value 
        ? (messagesContainer.value.scrollHeight - messagesContainer.value.scrollTop <= messagesContainer.value.clientHeight + 150)
        : true

      // Bunyi notifikasi jika ada pesan baru dari orang lain
      if (lastServerMsg && lastServerMsg.senderId !== currentUser.id) {
         if (data.length > messages.value.length) {
            playNotificationSound()
         }
      }

      messages.value = data
      
      // Jika chat sedang terbuka, tandai sebagai terbaca
      if (isOpen.value && activeConversation.value) {
        markAsRead(activeConversation.value.partnerId)
      }

      if (isAtBottom) scrollToBottom()
    }
  } catch (e) { console.error(e) }
}

// --- LOGIKA READ MESSAGE ---
const markAsRead = async (partnerId: number) => {
  // 1. Update UI Lokal (Optimistic) - Reset unread count di list
  const convIndex = conversations.value.findIndex(c => c.partnerId === partnerId)
  if (convIndex !== -1) {
    conversations.value[convIndex].unreadCount = 0
  }

  // 2. Panggil API Backend
  try {
    await $fetch('/api/chat/read', {
      method: 'PUT',
      body: { senderId: partnerId }
    })
  } catch (e) {
    console.error("Gagal update status read", e)
  }
}

// --- ACTIONS ---

const confirmDeleteMessage = (msg: any) => {
  msgToDelete.value = msg
  showDeleteConfirm.value = true
}

const handleDelete = async () => {
  if (!msgToDelete.value) return

  const msgId = msgToDelete.value.id
  const originalMessages = [...messages.value]
  
  // Optimistic Update
  messages.value = messages.value.filter(m => m.id !== msgId)
  showDeleteConfirm.value = false
  
  try {
    await $fetch(`/api/chat/${msgId}`, { method: 'DELETE' })
  } catch (e) {
    console.error('Gagal menghapus pesan', e)
    toast.error(t('chat.delete_error') || 'Gagal menghapus pesan')
    messages.value = originalMessages
  } finally {
    msgToDelete.value = null
  }
}

const openNewChat = () => { showContacts.value = true; fetchContacts() }
const backToConversations = () => { showContacts.value = false; activeConversation.value = null; fetchConversations() }

// Wrapper untuk membuka percakapan dan menandai sebagai dibaca
const handleSetConversation = (conv: any) => {
  setConversation(conv)
  markAsRead(conv.partnerId) // Tandai terbaca saat diklik
  showContacts.value = false
  fetchMessages().then(() => scrollToBottom(false))
}

const startChatWith = (contact: any) => {
  const conversationData = {
    partnerId: contact.id,
    name: contact.name,
    photo: contact.photo,
    role: contact.role,
    unreadCount: 0 
  }
  handleSetConversation(conversationData)
}

const sendMessage = async () => {
  if (!messageInput.value.trim() || !activeConversation.value) return

  const content = messageInput.value
  const replyData = replyingTo.value

  const tempMsg = {
    id: Date.now(), 
    content: content,
    senderId: currentUser.id,
    createdAt: new Date().toISOString(),
    isRead: false,
    sender: { id: currentUser.id, name: currentUser.name, photoProfile: currentUser.photoProfile },
    replyTo: replyData ? { id: replyData.id, content: replyData.content, sender: { name: replyData.sender.name } } : null
  }

  messages.value.push(tempMsg)
  messageInput.value = ''
  cancelReply()
  scrollToBottom()
  isSending.value = true

  try {
    await $fetch('/api/chat/send', {
      method: 'POST',
      body: {
        message: content,
        receiverId: activeConversation.value.partnerId,
        replyToId: replyData?.id
      }
    })
    await fetchMessages()
  } catch (e) {
    console.error('Gagal kirim pesan', e)
  } finally {
    isSending.value = false
  }
}

const handleReplyClick = (msg: any) => { setReplyTo(msg); nextTick(() => inputRef.value?.focus()) }

const isSameSender = (index: number) => {
  if (index === 0) return false
  return messages.value[index].senderId === messages.value[index - 1].senderId
}

// --- POLLING & WATCHERS ---
onMounted(() => {
  pollingInterval = setInterval(() => {
    if (isOpen.value) {
      if (activeConversation.value) {
        fetchMessages()
        markAsRead(activeConversation.value.partnerId) // Pastikan tetap terbaca saat chat terbuka
      } else {
        fetchConversations()
      }
    } else {
      fetchConversations() // Update badge di luar
    }
  }, 3000)
})

onUnmounted(() => { if (pollingInterval) clearInterval(pollingInterval) })

watch(isOpen, (val) => {
  if (val) {
    fetchConversations()
    if (activeConversation.value) {
      fetchMessages().then(() => scrollToBottom(false))
      markAsRead(activeConversation.value.partnerId)
    }
  }
})

watch(activeConversation, (val) => {
  if (val) fetchMessages().then(() => scrollToBottom(false))
})
</script>

<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none font-sans">
    
    <transition
      enter-active-class="transition ease-out duration-300 transform"
      enter-from-class="opacity-0 translate-y-10 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-200 transform"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-10 scale-95"
    >
      <div 
        v-if="isOpen" 
        class="bg-white dark:bg-gray-900 w-full sm:w-96 h-[550px] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden pointer-events-auto mb-4"
      >
        <div class="h-16 bg-blue-600 dark:bg-blue-800 flex items-center justify-between px-4 text-white flex-shrink-0 shadow-md z-10">
          <div class="flex items-center gap-3">
            <button 
              v-if="activeConversation || showContacts" 
              @click="backToConversations"
              class="hover:bg-blue-700 p-1.5 rounded-full transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            
            <div v-if="activeConversation" class="flex items-center gap-3">
              <div class="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border border-white/30">
                 <img v-if="activeConversation.photo" :src="activeConversation.photo" class="w-full h-full object-cover" />
                 <span v-else class="font-bold text-sm">{{ activeConversation.name?.[0]?.toUpperCase() }}</span>
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-sm truncate max-w-[140px] leading-tight">
                  {{ activeConversation.name }}
                </h3>
                <p class="text-[11px] text-blue-100 opacity-90 truncate">{{ activeConversation.role }}</p>
              </div>
            </div>
            <div v-else-if="showContacts">
              <h3 class="font-bold text-lg">{{ $t('chat.new_contact') }}</h3>
            </div>
            <div v-else>
              <h3 class="font-bold text-lg">{{ $t('chat.messages') }}</h3>
            </div>
          </div>
          
          <div class="flex items-center gap-1">
             <button v-if="!activeConversation && !showContacts" @click="openNewChat" class="hover:bg-blue-700 p-2 rounded-full transition" :title="$t('chat.start_new_chat')">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
             </button>
             <button @click="toggleChat" class="hover:bg-blue-700 p-2 rounded-full transition">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
             </button>
          </div>
        </div>

        <div v-if="activeConversation" class="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950 scroll-smooth" ref="messagesContainer">
          <div class="space-y-1 pb-2">
            <div v-for="(msg, index) in messages" :key="msg.id || index" class="flex flex-col group" :class="msg.senderId === currentUser.id ? 'items-end' : 'items-start'">
              <div 
                class="relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all"
                :class="[
                  msg.senderId === currentUser.id 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none',
                  isSameSender(index) ? 'mt-1' : 'mt-3'
                ]"
              >
                <div v-if="msg.replyTo" class="mb-2 rounded-lg p-2 text-xs border-l-4 opacity-90 select-none cursor-pointer" :class="msg.senderId === currentUser.id ? 'bg-blue-700 border-blue-300 text-blue-50' : 'bg-gray-100 dark:bg-gray-700 border-blue-500 text-gray-600 dark:text-gray-300'">
                  <p class="font-bold mb-0.5">{{ msg.replyTo.sender.name }}</p>
                  <p class="truncate line-clamp-1">{{ msg.replyTo.content }}</p>
                </div>

                <p class="leading-relaxed whitespace-pre-wrap break-words">{{ msg.content }}</p>
                
                <span class="text-[10px] block mt-1 text-right opacity-70" :class="msg.senderId === currentUser.id ? 'text-blue-100' : 'text-gray-400'">
                  {{ new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                  <span v-if="msg.senderId === currentUser.id" class="ml-1">{{ msg.id ? '✓' : '🕒' }}</span>
                </span>

                <div 
                  class="absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  :class="msg.senderId === currentUser.id ? '-left-[4.5rem]' : '-right-[4.5rem]'"
                >
                  <button 
                    v-if="msg.senderId === currentUser.id"
                    @click="confirmDeleteMessage(msg)" 
                    class="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm hover:scale-110 hover:bg-red-200 transition"
                    :title="$t('common.delete')"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>

                  <button 
                    @click="handleReplyClick(msg)"
                    class="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm hover:scale-110 hover:bg-gray-200 transition"
                    :title="$t('chat.reply_to')"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div v-else-if="showContacts" class="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-900">
           <div v-if="contacts.length === 0" class="h-full flex items-center justify-center text-gray-500">
             <p>{{ $t('chat.no_contacts') }}</p>
           </div>
           <ul v-else class="space-y-1">
             <li v-for="contact in contacts" :key="contact.id">
               <button @click="startChatWith(contact)" class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition text-left group">
                 <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    <img v-if="contact.photo" :src="contact.photo" class="w-full h-full object-cover" />
                    <span v-else class="font-bold text-gray-500 dark:text-gray-300">{{ contact.name[0] }}</span>
                 </div>
                 <div class="flex-1 min-w-0">
                   <h4 class="font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 transition-colors">{{ contact.name }}</h4>
                   <p class="text-xs text-gray-500 truncate capitalize">{{ contact.role }}</p>
                 </div>
               </button>
             </li>
           </ul>
        </div>

        <div v-else class="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-900">
          <div v-if="conversations.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 text-center p-6">
             <svg class="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
             <p class="text-sm">{{ $t('chat.no_conversations') }}</p>
             <button @click="openNewChat" class="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">{{ $t('chat.start_new_chat') }}</button>
          </div>
          <ul v-else class="space-y-1">
            <li v-for="conv in conversations" :key="conv.partnerId">
              <button @click="handleSetConversation(conv)" class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition text-left group relative">
                <div class="w-11 h-11 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 font-bold overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img v-if="conv.photo" :src="conv.photo" class="w-full h-full object-cover" />
                  <span v-else>{{ conv.name[0] }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-center mb-0.5">
                    <h4 class="font-bold text-gray-800 dark:text-gray-200 truncate text-sm group-hover:text-blue-600 transition-colors">{{ conv.name }}</h4>
                    <span class="text-[10px] text-gray-400">{{ new Date(conv.timestamp).toLocaleDateString() }}</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate pr-4" :class="{'font-bold text-gray-800 dark:text-gray-200': conv.unreadCount > 0}">
                    {{ conv.lastMessage }}
                  </p>
                </div>
                
                <div v-if="conv.unreadCount > 0" class="absolute right-3 bottom-3 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {{ conv.unreadCount }}
                </div>
              </button>
            </li>
          </ul>
        </div>

        <div v-if="activeConversation" class="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2 z-10">
          <transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-150" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
            <div v-if="replyingTo" class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-l-[3px] border-blue-500 shadow-sm">
              <div class="overflow-hidden pr-2">
                <p class="text-xs font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                  {{ $t('chat.reply_to') }} {{ replyingTo.senderId === currentUser.id ? $t('chat.yourself') : replyingTo.sender.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ replyingTo.content }}</p>
              </div>
              <button @click="cancelReply" class="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
          </transition>
          <form @submit.prevent="sendMessage" class="flex gap-2 items-end">
            <input ref="inputRef" v-model="messageInput" type="text" :placeholder="$t('chat.type_message')" class="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-400"/>
            <button type="submit" :disabled="!messageInput.trim() || isSending" class="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md active:scale-95 flex-shrink-0">
              <svg v-if="isSending" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>
        </div>
      </div>
    </transition>

    <button @click="toggleChat" class="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-110 pointer-events-auto flex items-center justify-center group relative">
      <span v-if="!isOpen" class="absolute right-full mr-4 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-xl font-medium">{{ $t('chat.chat_admin_tooltip') }}</span>
      
      <div v-if="totalUnread > 0 && !isOpen" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-gray-900 z-20 animate-bounce">
        {{ totalUnread > 99 ? '99+' : totalUnread }}
      </div>

      <svg v-if="!isOpen" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      <svg v-else class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
    </button>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
        
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 text-center border border-gray-100 dark:border-gray-800 transform transition-all">
          <div class="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 text-2xl">
            🗑️
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {{ $t('chat.delete_confirm_title') || 'Hapus Pesan?' }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {{ $t('chat.delete_confirm') }}
          </p>
          
          <div class="flex gap-3">
             <button 
               @click="showDeleteConfirm = false" 
               class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium"
             >
               {{ $t('common.cancel') }}
             </button>
             <button 
               @click="handleDelete" 
               class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md hover:shadow-lg transition text-sm font-medium transform hover:-translate-y-0.5"
             >
               {{ $t('common.delete') }}
             </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
div::-webkit-scrollbar { width: 5px; }
div::-webkit-scrollbar-track { background: transparent; }
div::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
div:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
.dark div::-webkit-scrollbar-thumb { background: #475569; }
</style>