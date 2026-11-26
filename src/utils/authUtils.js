export const getStoredUser = () => {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    return null;
  }
  try {
    return JSON.parse(savedUser);
  } catch (error) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
};

export const setStoredUser = (user, token) => {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
  if (token) {
    localStorage.setItem("token", token);
  }
};

export const clearStoredUser = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};
