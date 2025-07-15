const handleSendOtp = async () => {
  const response = await fetch("http://localhost:5000/api/auth/send-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ emailOrMobile: "test@example.com" }),
  });

  const data = await response.json();
  console.log(data); // shows: { message: "OTP sent successfully." }
};
