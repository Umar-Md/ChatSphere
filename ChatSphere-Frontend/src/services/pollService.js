import api from "./api";

export const createPoll = async ({
  conversationId,
  question,
  options,
  expiresAt = null,
}) => {
  const response = await api.post("/polls", {
    conversationId,
    question,
    options,
    expiresAt,
  });

  return response.data?.data || null;
};

export const getPoll = async (pollId) => {
  const response = await api.get(`/polls/${pollId}`);

  return response.data?.data || null;
};

export const votePoll = async (
  pollId,
  optionId
) => {
  const response = await api.post(
    `/polls/${pollId}/vote`,
    { optionId }
  );

  return response.data?.data || null;
};

export const closePoll = async (pollId) => {
  const response = await api.patch(
    `/polls/${pollId}/close`
  );

  return response.data?.data || null;
};