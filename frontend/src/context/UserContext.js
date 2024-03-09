import React, { createContext, useContext, useState, useEffect } from "react";
const apiBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null
  );

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/current-user`, {
          credentials: "include", // if your backend expects credentials/cookies
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          throw new Error("Failed to fetch current user");
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Check if user data is not already loaded from localStorage
    if (!user) {
      fetchCurrentUser();
    }
  }, [user]);

  useEffect(() => {
    // Also store user data in localStorage whenever it changes
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
