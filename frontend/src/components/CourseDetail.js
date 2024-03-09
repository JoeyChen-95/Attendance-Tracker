import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Ensure the path to your UserContext is correct
const apiBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";

function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useUser(); // Use context to get the logged-in user's info
  const [course, setCourse] = useState(null);
  const [classes, setClasses] = useState([]);
  const [newClassTopic, setNewClassTopic] = useState("");

  const fetchCourseDetailsAndClasses = useCallback(async () => {
    try {
      // Fetch course details
      const courseRes = await fetch(`${apiBaseUrl}/api/courses/${courseId}`);
      if (!courseRes.ok) throw new Error("Failed to fetch course details");
      const courseData = await courseRes.json();
      setCourse(courseData);

      // Determine the correct endpoint based on the user's role
      let classesEndpoint =
        user.role === "instructor"
          ? `${apiBaseUrl}/api/courses/${courseId}/classes`
          : `${apiBaseUrl}/api/students/${user.userId}/courses/${courseId}/classes`;

      // Fetch classes for this course
      const response = await fetch(classesEndpoint);
      if (!response.ok) throw new Error("Failed to fetch classes");
      const classesData = await response.json();
      setClasses(classesData);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [courseId, user]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseUrl}/api/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization header if needed
        },
        body: JSON.stringify({ course: courseId, topic: newClassTopic }),
      });
      if (!response.ok) throw new Error("Failed to create class");
      // Refresh classes list after creation
      setNewClassTopic(""); // Reset the input field
      fetchCourseDetailsAndClasses();
    } catch (error) {
      console.error("Error creating class:", error);
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/classes/${classId}`, {
        method: "DELETE",
        headers: {
          // Authorization header if needed
        },
      });
      if (!response.ok) throw new Error("Failed to delete class");
      // Refresh classes list after deletion
      fetchCourseDetailsAndClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  useEffect(() => {
    if (user && user.userId) {
      fetchCourseDetailsAndClasses();
    }
  }, [fetchCourseDetailsAndClasses, courseId, user]); // Depend on courseId and user
  if (!user) return <div> You are no logged in!</div>;
  if (!course) return <div>Loading...</div>;

  return (
    <div>
      <h2>{course?.title}</h2>
      <p>Course ID: {courseId}</p>
      <p>Course Description: {course.description}</p>
      {user.role === "instructor" && (
        <div>
          <h3>Create a New Class</h3>
          <form onSubmit={handleCreateClass}>
            <input
              type="text"
              value={newClassTopic}
              onChange={(e) => setNewClassTopic(e.target.value)}
              placeholder="Class Topic"
              required
            />
            <button type="submit">Create Class</button>
          </form>
        </div>
      )}

      <h3>Classes</h3>
      <ul>
        {classes.map((cls) => (
          <li key={cls._id}>
            <Link to={`/classes/${cls._id}`}>{cls.topic}</Link>
            {user.role === "student" && ` - Attendance: `}
            {user.role === "student" &&
              (cls.attendance.find((a) => a.student === user.userId)?.attends
                ? "Present"
                : "Absent")}
            {user.role === "instructor" && (
              <button onClick={() => handleDeleteClass(cls._id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CourseDetail;
