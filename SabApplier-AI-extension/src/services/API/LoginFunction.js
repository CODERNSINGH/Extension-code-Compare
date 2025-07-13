/* global chrome */

const API_BASE_URL = 'https://api.sabapplier.com/api'
// const API_BASE_URL = 'https://api.sabapplier.com/api';

const LoginFunction = async (email, password, onStatusUpdate) => {
  try {
    if (email === "" || password === "") {
      onStatusUpdate("Please enter your email ID", "error");
      throw new Error("Please enter your email ID");
    }

    onStatusUpdate("1. Sending login request...", "success");
    const response = await fetch(`${API_BASE_URL}/users/extension/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify({
        user_email: email,
        user_password: password,
      }),
    });

    onStatusUpdate("2. Processing response...", "success");

    if (response.status != 200) {
      onStatusUpdate(
        "User doesn't exist or please try again later...",
        "failed"
      );
      setTimeout(() => onStatusUpdate("", "clear"), 5000);
      throw new Error("Failed Check Credentials or try later.");
    }

    const data = await response.json();
    onStatusUpdate("3. Login successful!", "success");
    setTimeout(() => onStatusUpdate("", "clear"), 5000);
    return data;
  } catch (error) {
    onStatusUpdate("Error: " + error.message, "error");
    throw error;
  }
};

export default LoginFunction;

