import React, { useEffect, useState } from "react";

function RegisteredCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Assuming you have an endpoint that returns courses for the logged-in user
        // and you're storing the user's ID in the session storage or local storage
        const userId = sessionStorage.getItem("userId"); // or localStorage.getItem('userId');
        const response = await fetch(`/api/students/${userId}/courses`);
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!courses.length) return <div>No registered courses found.</div>;

  return (
    <div>
      <h2>Registered Courses</h2>
      <ul>
        {courses.map((course) => (
          <li key={course._id}>{course.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default RegisteredCourses;
