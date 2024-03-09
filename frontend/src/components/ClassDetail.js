import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Adjust import path as necessary
const apiBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";

function ClassDetail() {
  const { classId } = useParams();
  const { user } = useUser();
  const [classInfo, setClassInfo] = useState(null);
  const [isClassActive, setIsClassActive] = useState(false); // Default to false until fetched

  const fetchClassInfo = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch class details");
      }
      const data = await response.json();
      setClassInfo(data);
      setIsClassActive(data.active); // Assume the 'active' property is part of the class info
    } catch (error) {
      console.error("Error fetching class details:", error);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassInfo();
  }, [fetchClassInfo, classId]);

  const handleAttendance = async (studentId = user.userId) => {
    const endpoint = `${apiBaseUrl}/api/classes/${classId}/attendance/${studentId}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark attendance");
      }

      alert("Attendance marked successfully");
      fetchClassInfo(); // Refresh class info to reflect the attendance update
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance");
    }
  };

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

  if (!classInfo) return <div>Loading...</div>;

  return (
    <div>
      <h2>{classInfo.topic}</h2>
      <div>Class is {isClassActive ? "Active" : "Not Active"}</div>
      {user.role === "student" ? (
        <>
          <button onClick={() => handleAttendance()} disabled={!isClassActive}>
            Mark Attendance
          </button>
          {!isClassActive && (
            <p>
              This class is currently not active. Attendance cannot be marked.
            </p>
          )}
        </>
      ) : (
        <>
          <button onClick={toggleClassActiveStatus}>
            {isClassActive ? "Deactivate Class" : "Activate Class"}
          </button>
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
