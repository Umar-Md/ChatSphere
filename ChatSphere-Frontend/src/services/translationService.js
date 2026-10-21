import api from "./api";

export const translateText = async ({
  text,
  source = "auto",
  target,
}) => {
  if (!text?.trim()) {
    throw new Error("Text is required");
  }

  if (!target) {
    throw new Error("Target language is required");
  }

  const response = await api.post("/translate", {
    text: text.trim(),
    source,
    target,
  });

  return response.data?.data?.translatedText || "";
};