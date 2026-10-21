import api from "./api";
export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};
export const loginUser = async (userData) => {
    const response = await api.post("/auth/login", userData);
    return response.data;
};
export const verifyRegistration = async (data) => {
    const response = await api.post("/auth/verify-email", data);
    return response.data;
};
