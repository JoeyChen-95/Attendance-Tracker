import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const apiBaseUrl = process.env.BACKEND_URL || "http://3.88.9.11:8080";

function Login() {
  const [email, setEmail] = useState(""); // Changed from userId to email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error message

    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Update the body to use email instead of userId
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "An error occurred");
        return;
      } else {
        setUser(data); // Update the global user state
        navigate("/registered-courses"); // Navigate to RegisteredCourses page
        return;
      }
    } catch (err) {
      setError("Failed to connect to the server");
    }
  };

  return (
    <div>
      <h2>Login aa</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label> {/* Updated label */}
          <input
            type="text"
            id="email" // Updated id
            value={email} // Updated value
            onChange={(e) => setEmail(e.target.value)} // Updated onChange handler
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
