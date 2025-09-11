import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { Message } from "ai";
import {
  generateChatId,
  loadChatFromS3,
  saveChatToS3,
} from "@/lib/chat-persistence";

interface ChatState {
  activeChatId: string | null;
  chats: Record<string, Message[]>;
  loadingChats: Record<string, boolean>;
  savingChats: Record<string, boolean>;
  error: string | null;
}

const initialState: ChatState = {
  activeChatId: null,
  chats: {},
  loadingChats: {},
  savingChats: {},
  error: null,
};

// Async thunks for S3 operations
export const loadChatFromS3Thunk = createAsyncThunk(
  "chat/loadFromS3",
  async (chatId: string, { rejectWithValue }) => {
    try {
      const messages = await loadChatFromS3(chatId);
      return { chatId, messages };
    } catch (error: unknown) {
      console.error("Error loading chat:", error);
      return rejectWithValue(
        `Failed to load chat: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
);

export const saveChatToS3Thunk = createAsyncThunk(
  "chat/saveToS3",
  async (
    { chatId, messages }: { chatId: string; messages: Message[] },
    { rejectWithValue }
  ) => {
    try {
      await saveChatToS3(chatId, messages);
      return { chatId, messages };
    } catch (error: unknown) {
      console.error("Error saving chat:", error);
      return rejectWithValue(
        `Failed to save chat: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: Message }>
    ) => {
      const { chatId, message } = action.payload;
      if (!state.chats[chatId]) {
        state.chats[chatId] = [];
      }
      state.chats[chatId] = [...state.chats[chatId], message];
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      const chatId = action.payload;

      // If chatId is null, just clear the active chat
      if (chatId === null) {
        state.activeChatId = null;
        return;
      }

      // Otherwise, ensure the chat exists before setting it active
      if (!state.chats[chatId]) {
        state.chats[chatId] = [];
      }
      state.activeChatId = chatId;
    },
    createNewChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload || generateChatId();
      if (!state.chats[chatId]) {
        state.chats[chatId] = [];
      }
      state.activeChatId = chatId;
    },
    createNewEvent: (
      state,
      action: PayloadAction<{ eventId: string; initialMessage: string }>
    ) => {
      const { eventId, initialMessage } = action.payload;
      const chatId = eventId || generateChatId();
      state.chats[chatId] = [
        {
          id: `msg-${Date.now()}`,
          content: initialMessage,
          role: "assistant",
          createdAt: new Date().toISOString(),
        },
      ];
      state.activeChatId = chatId;
    },
    clearChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (state.chats[chatId]) {
        state.chats[chatId] = [];
      } else {
        console.warn(`Chat ID ${chatId} does not exist.`);
      }
    },
    clearAllChats: (state) => {
      state.chats = {};
      state.activeChatId = null;
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        messageId: string;
        content: string;
      }>
    ) => {
      const { chatId, messageId, content } = action.payload;
      const chat = state.chats[chatId];
      if (chat) {
        const message = chat.find((msg) => msg.id === messageId);
        if (message) {
          message.content = content;
        } else {
          console.warn(
            `Message ID ${messageId} does not exist in chat ${chatId}.`
          );
        }
      } else {
        console.warn(`Chat ID ${chatId} does not exist.`);
      }
    },
    deleteMessage: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string }>
    ) => {
      const { chatId, messageId } = action.payload;
      const chat = state.chats[chatId];
      if (chat) {
        state.chats[chatId] = chat.filter((msg) => msg.id !== messageId);
      } else {
        console.warn(`Chat ID ${chatId} does not exist.`);
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle loadChatFromS3 states
      .addCase(loadChatFromS3Thunk.pending, (state, action) => {
        const chatId = action.meta.arg;
        state.loadingChats[chatId] = true;
        state.error = null;
      })
      .addCase(loadChatFromS3Thunk.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        state.chats[chatId] = messages;
        state.loadingChats[chatId] = false;
      })
      .addCase(loadChatFromS3Thunk.rejected, (state, action) => {
        const chatId = action.meta.arg;
        state.loadingChats[chatId] = false;
        state.error = (action.payload as string) || "Failed to load chat";
      })

      // Handle saveChatToS3 states
      .addCase(saveChatToS3Thunk.pending, (state, action) => {
        const chatId = action.meta.arg.chatId;
        state.savingChats[chatId] = true;
        state.error = null;
      })
      .addCase(saveChatToS3Thunk.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        state.savingChats[chatId] = false;
      })
      .addCase(saveChatToS3Thunk.rejected, (state, action) => {
        const chatId = action.meta.arg.chatId;
        state.savingChats[chatId] = false;
        state.error = (action.payload as string) || "Failed to save chat";
      });
  },
});

// Selectors
export const selectActiveChatMessages = (state: ChatState) => {
  if (state.activeChatId && state.chats[state.activeChatId]) {
    return state.chats[state.activeChatId];
  }
  return [];
};

export const selectChatMessages = (state: ChatState, chatId: string) => {
  return state.chats[chatId] || [];
};

export const selectIsLoadingChat = (state: ChatState, chatId: string) => {
  return !!state.loadingChats[chatId];
};

export const selectIsSavingChat = (state: ChatState, chatId: string) => {
  return !!state.savingChats[chatId];
};

export const {
  addMessage,
  setActiveChat,
  createNewChat,
  createNewEvent,
  clearChat,
  clearAllChats,
  updateMessage,
  deleteMessage,
  setError,
} = chatSlice.actions;
export default chatSlice.reducer;
