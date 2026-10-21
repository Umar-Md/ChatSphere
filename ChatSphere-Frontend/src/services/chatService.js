import api from "./api";

export const getConversations = async () => {
  const res = await api.get("/conversations");
  return res.data.data || [];
};
export const getOrCreateDirectConversation = async (receiverId) => {
  const res = await api.post("/conversations/direct", {
    receiverId,
  });

  return res.data.data;
};

export const getMessages = async (conversationId) => {
  const res = await api.get(`/messages/${conversationId}`);
  return res.data.data || [];
};

export const sendMessage = async ({
  receiverId,
  conversationId,
  text,
  file,
  audio,
  expiresIn,
  messageType,
}) => {
  const formData = new FormData();

  if (receiverId) {
    formData.append(
      "receiverId",
      receiverId
    );
  }

  if (conversationId) {
    formData.append(
      "conversationId",
      conversationId
    );
  }

  if (text?.trim()) {
    formData.append(
      "text",
      text.trim()
    );
  }

  if (file) {
    formData.append("file", file);
  }

  if (audio) {
    formData.append("audio", audio);
  }

  if (expiresIn) {
    formData.append(
      "expiresIn",
      String(expiresIn)
    );
  }

  if (messageType) {
    formData.append(
      "messageType",
      messageType
    );
  }

  // Let Axios/browser set the multipart boundary automatically.
  const response = await api.post("/messages/send", formData);

  return response.data.data;
};

export const markMessagesRead = async (conversationId) => {
  const res = await api.put(`/messages/read/${conversationId}`);
  return res.data;
};

export const scheduleMessage = async (payload) => {
  const res = await api.post("/messages/schedule", payload);
  return res.data.data?.scheduledMessage;
};

export const getScheduledMessages = async () => {
  const res = await api.get("/messages/scheduled");
  return res.data.data || [];
};

export const cancelScheduledMessage = async (messageId) => {
  const res = await api.delete(`/messages/scheduled/${messageId}`);
  return res.data;
};

export const createPoll = async (payload) => {
  const res = await api.post("/polls", payload);
  return res.data.data.poll;
};

export const votePoll = async (pollId, optionId) => {
  const res = await api.post(`/polls/${pollId}/vote`, { optionId });
  return res.data.data.poll;
};

export const getPoll = async (pollId) => {
  const res = await api.get(`/polls/${pollId}`);
  return res.data.data;
};

export const bookmarkMessage = async (messageId) => {
  const res = await api.post("/bookmarks", { messageId });
  return res.data;
};

export const removeBookmark = async (messageId) => {
  const res = await api.delete(`/bookmarks/${messageId}`);
  return res.data;
};

export const getBookmarks = async () => {
  const res = await api.get("/bookmarks");
  return res.data.data?.bookmarks || [];
};

export const checkBookmark = async (messageId) => {
  const res = await api.get(`/bookmarks/check/${messageId}`);
  return res.data.data?.isBookmarked || false;
};

export const uploadMedia = async (files) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("media", file);
  });

  const res = await api.post("/media/upload", formData);
  return res.data.data || [];
};

export const forwardMessage = async (messageId, conversationId) => {
  const res = await api.post(`/messages/forward/${messageId}`, { conversationId });
  return res.data.data;
};
