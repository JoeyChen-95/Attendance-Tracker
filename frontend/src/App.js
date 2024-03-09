import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import RegisteredCourses from "./components/RegisteredCourses";
import { UserProvider } from "./context/UserContext";
import WelcomeBanner from "./components/WelcomeBanner";
import CourseDetail from "./components/CourseDetail";
import ClassDetail from "./components/ClassDetail";

const AppContent = () => {
  const location = useLocation();
  return (
    <div>
      <WelcomeBanner />
      {location.pathname === "/" && (
        <Link to="/login">
          <button>Login</button>
        </Link>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registered-courses" element={<RegisteredCourses />} />
        <Route
          path="/registered-courses/:courseId"
          element={<CourseDetail />}
        />
        <Route path="/classes/:classId" element={<ClassDetail />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;
