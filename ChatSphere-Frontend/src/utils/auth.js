export const getToken = () => {
  return sessionStorage.getItem("token");
};

export const saveToken = (token) => {
  sessionStorage.setItem("token", token);
};

export const removeToken = () => {
  sessionStorage.removeItem("token");
};

export const isAuthenticated = () => {
  return !!getToken();
};