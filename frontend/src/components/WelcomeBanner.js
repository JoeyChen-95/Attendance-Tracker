import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { useUser } from "../context/UserContext"; // Adjust the import path if necessary
const apiBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";

const WelcomeBanner = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleLogout = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/logout`, {
        method: "GET", // Assuming your logout endpoint uses POST
        credentials: "include", // If your API requires cookies
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      setUser(null); // Reset the user state
      localStorage.removeItem("user"); // Clear user from localStorage

      navigate("/"); // Redirect to the homepage
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user)
    return (
      <div>
        Welcome users, please login!<button onClick={handleLogout}>Home</button>{" "}
      </div>
    );

  return (
    <div>
      Welcome, {user.name}!
      <Link to="/registered-courses">Go to My Courses</Link>
      <button onClick={handleLogout}>Logout</button> {/* Logout button */}
    </div>
  );
};

export default WelcomeBanner;
