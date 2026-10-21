import api from "./api";

export const smartReply = async (message) => {
  const res = await api.post("/ai/smart-reply", { message });
  return res.data.data;
};

export const summarize = async (text) => {
  const res = await api.post("/ai/summarize", { text });
  return res.data.data;
};

export const explain = async (text) => {
  const res = await api.post("/ai/explain", { text });
  return res.data.data;
};

export const rephrase = async (text) => {
  const res = await api.post("/ai/rephrase", { text });
  return res.data.data;
};

export const translateText = async ({ text, source = "auto", target }) => {
  const res = await api.post("/translate", { text, source, target });
  return res.data.data;
};
