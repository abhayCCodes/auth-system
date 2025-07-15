// src/api/index.js
const BASE_URL = "http://localhost:5000/api";

export const sendOtp = async (emailOrMobile) => {
  const response = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrMobile }),
  });
  return await response.json();
};

export const verifyOtp = async (emailOrMobile, otp) => {
  const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrMobile, otp }),
  });
  return await response.json();
};

export const registerUser = async ({ name, emailOrMobile, password }) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, emailOrMobile, password }),
  });
  return await response.json();
};

export const loginUser = async ({ emailOrMobile, password }) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrMobile, password }),
  });
  return await response.json();
};

export const resetPassword = async ({ emailOrMobile, newPassword }) => {
  const response = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrMobile, newPassword }),
  });
  return await response.json();
};

