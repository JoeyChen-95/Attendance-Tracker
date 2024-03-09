import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const apiBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";

function RegisteredCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Fetch the current logged-in user's information
        const userResponse = await fetch(`${apiBaseUrl}/api/current-user`, {
          credentials: "include", // Ensure cookies are sent with the request
        });
        if (!userResponse.ok) throw new Error("Failed to fetch user info");
        const userInfo = await userResponse.json();

        let coursesResponse;
        if (userInfo.role === "student") {
          // Fetch the registered courses for the student
          coursesResponse = await fetch(
            `${apiBaseUrl}/api/students/${userInfo.userId}/courses`
          );
        } else if (userInfo.role === "instructor") {
          // Fetch the courses taught by the instructor
          coursesResponse = await fetch(
            `${apiBaseUrl}/api/instructors/${userInfo.userId}/courses`
          );
        }

        if (!coursesResponse.ok) throw new Error("Failed to fetch courses");
        const coursesData = await coursesResponse.json();

        setCourses(coursesData);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!courses.length) return <div>No registered courses found.</div>;

  return (
    <div>
      <h2>Registered Courses</h2>
      <ul>
        {courses.map((course) => (
          <li key={course._id}>
            {/* Update this line to make course titles clickable */}
            <Link to={`/registered-courses/${course._id}`}>{course.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RegisteredCourses;
