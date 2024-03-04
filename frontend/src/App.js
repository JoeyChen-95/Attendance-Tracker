import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./components/Login";
import RegisteredCourses from "./components/RegisteredCourses";
// Import other components

function App() {
  return (
    <Router>
      <div>
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/registered-courses">Courses</Link>
          {/* Add other navigation links as needed */}
        </nav>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registered-courses" element={<RegisteredCourses />} />
          {/* Define other routes */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
