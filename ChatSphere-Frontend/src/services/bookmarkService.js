import api from "./api";

export const addBookmark = async (
  messageId
) => {
  const response = await api.post(
    "/bookmarks",
    {
      messageId,
    }
  );

  return response.data;
};

export const removeBookmark = async (
  messageId
) => {
  const response = await api.delete(
    `/bookmarks/${messageId}`
  );

  return response.data;
};

export const getBookmarks = async () => {
  const response = await api.get(
    "/bookmarks"
  );

  return response.data;
};

export const checkBookmark = async (
  messageId
) => {
  const response = await api.get(
    `/bookmarks/check/${messageId}`
  );

  return response.data;
};