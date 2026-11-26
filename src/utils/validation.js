export const PASSWORD_VALIDATION_MESSAGE =
  "Password must be at least 6 characters and include an uppercase letter, a lowercase letter, and a special character.";

export const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 6 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

export const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
