import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '../../types';

interface ConversationState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  activeConversation: null,
  loading: false,
  error: null,
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
    },
    setActiveConversation: (state, action: PayloadAction<Conversation>) => {
      state.activeConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;

      // Add to active conversation
      if (state.activeConversation && state.activeConversation.id === conversationId) {
        state.activeConversation.messages.push(message);
      }

      // Add to conversations list
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.messages.push(message);
      }
    },
    updateMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string; updates: Partial<Message> }>) => {
      const { conversationId, messageId, updates } = action.payload;

      // Update in active conversation
      if (state.activeConversation && state.activeConversation.id === conversationId) {
        const message = state.activeConversation.messages.find(m => m.id === messageId);
        if (message) {
          Object.assign(message, updates);
        }
      }

      // Update in conversations list
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          Object.assign(message, updates);
        }
      }
    },
    clearActiveConversation: (state) => {
      state.activeConversation = null;
    },
    setConversationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setConversationError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearConversationError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setConversations,
  addConversation,
  setActiveConversation,
  addMessage,
  updateMessage,
  clearActiveConversation,
  setConversationLoading,
  setConversationError,
  clearConversationError,
} = conversationSlice.actions;

export default conversationSlice.reducer;