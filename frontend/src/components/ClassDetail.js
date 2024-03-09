import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Adjust import path as necessary
const apiBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";

function ClassDetail() {
  const { classId } = useParams();
  const { user } = useUser();
  const [classInfo, setClassInfo] = useState(null);
  const [isClassActive, setIsClassActive] = useState(false); // Default to false until fetched
  const [attendanceMarked, setAttendanceMarked] = useState(false); // New state to track if attendance has been marked

  const fetchClassInfo = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch class details");
      }
      const data = await response.json();
      setClassInfo(data);
      setIsClassActive(data.active);

      // Check if the logged-in student has already marked attendance
      if (user.role === "student") {
        const hasMarked = data.attendance.some(
          (att) => att.student._id === user.userId && att.attends
        );
        setAttendanceMarked(hasMarked);
      }
    } catch (error) {
      console.error("Error fetching class details:", error);
    }
  }, [classId, user.role, user.userId]);

  useEffect(() => {
    fetchClassInfo();
  }, [fetchClassInfo, classId]);

  const toggleStudentAttendance = async (studentId) => {
    if (user.role === "instructor") {
      const endpoint = `${apiBaseUrl}/api/classes/${classId}/toggle_attendance/${studentId}`;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to toggle attendance");
        }

        alert("Attendance changed successfully");
        fetchClassInfo(); // Refresh class info to reflect the attendance update
      } catch (error) {
        console.error("Error changing attendance:", error);
        alert("Failed to changing attendance");
      }
    }
  };

  const toggleClassActiveStatus = async () => {
    if (user.role === "instructor") {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/classes/${classId}/toggle-active`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to toggle class active status");
        }

        const updatedClassInfo = await response.json();
        setIsClassActive(updatedClassInfo.class.active); // Update local state to reflect the new active status
        alert("Class active status toggled successfully");
      } catch (error) {
        console.error("Error toggling class active status:", error);
        alert("Failed to toggle class active status");
      }
    }
  };

  const markAttendanceWithSecret = async (secretCode) => {
    if (!secretCode) return;

    const endpoint = `${apiBaseUrl}/api/classes/${classId}/attendance/${user.userId}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretCode }), // Send the secret code along with the request
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to mark attendance");
      }

      alert("Attendance marked successfully");
      fetchClassInfo(); // Refresh class info to reflect the attendance update
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert(error.message || "Failed to mark attendance");
    }
  };

  const handleAttendance = () => {
    // Prompt the student for the secret code
    const inputSecretCode = window.prompt(
      "Please enter the secret code for this class:"
    );
    markAttendanceWithSecret(inputSecretCode);
  };

  const updateClassInfo = async (fieldToUpdate, newValue) => {
    if (user.role === "instructor") {
      try {
        const response = await fetch(`${apiBaseUrl}/api/classes/${classId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [fieldToUpdate]: newValue }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update class ${fieldToUpdate}`);
        }

        alert(`Class ${fieldToUpdate} updated successfully`);
        fetchClassInfo(); // Refresh class info to reflect the update
      } catch (error) {
        console.error(`Error updating class ${fieldToUpdate}:`, error);
        alert(`Failed to update class ${fieldToUpdate}`);
      }
    }
  };

  const handleUpdateTopic = () => {
    const newTopic = window.prompt("Enter the new class topic:");
    if (newTopic) {
      updateClassInfo("topic", newTopic);
    }
  };

  const handleUpdateSecretCode = () => {
    const newSecretCode = window.prompt("Enter the new secret code:");
    if (newSecretCode) {
      updateClassInfo("secretCode", newSecretCode);
    }
  };

  if (!classInfo) return <div>Loading...</div>;

  return (
    <div>
      <h1>{classInfo.topic}</h1>
      <h3>Course: {classInfo.course.title}</h3>
      <h3>Class Status: {isClassActive ? "Active" : "Not Active"}</h3>
      {user.role === "student" ? (
        <>
          <h3>Attendance</h3>
          {attendanceMarked ? (
            <p style={{ color: "green" }}>You have marked the attendance</p>
          ) : (
            <button
              onClick={handleAttendance}
              disabled={!isClassActive || attendanceMarked}
            >
              Mark Attendance
            </button>
          )}
          {!isClassActive && (
            <p style={{ color: "red" }}>
              This class is currently not active. Attendance cannot be marked.
            </p>
          )}
        </>
      ) : (
        <>
          <h3>Secret Code: {classInfo.secretCode}</h3>
          <button onClick={toggleClassActiveStatus}>
            {isClassActive ? "Close Attendance" : "Open Attendance"}
          </button>
          <button onClick={handleUpdateTopic}>Update Class Topic</button>
          <button onClick={handleUpdateSecretCode}>Update Secret Code</button>
          <h3>Students' Attendance</h3>
          {classInfo.attendance.map((att, index) => (
            <div key={att.student}>
              {index + 1}. {att.student.name} - {att.student.email} - Status:{" "}
              {att.attends ? "Present" : "Absent"}
              <button onClick={() => toggleStudentAttendance(att.student._id)}>
                Toggle Attendance
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default ClassDetail;
