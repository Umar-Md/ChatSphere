const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const uploadMedia = async (file) => {
  const token = sessionStorage.getItem("token");

  const formData = new FormData();

  formData.append("media", file);

  const response = await fetch(
    `${API_URL}/api/media/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Media upload failed");
  }

  const data = await response.json();
  return data.data || [];
};