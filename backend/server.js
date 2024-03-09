const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const Course = require("./models/Course");
const Class = require("./models/Class");
const session = require("express-session");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");
const cors = require("cors"); // Require cors package
require("dotenv").config();
const PORT = process.env.PORT || 8080;
const mongo_host = process.env.MONGO_DB_HOST || "localhost";

const app = express();

app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://127.0.0.1:3000"); //前端域名
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  next();
});

const corsOptions = {
  origin: "http://localhost:3000", // This should be the domain of your frontend application
  credentials: true, // This sets Access-Control-Allow-Credentials to true.
  methods: "PUT,POST,GET,DELETE,OPTIONS",
};

app.use(cors(corsOptions));

app.use(express.json());

const username = "rootuser";
const password = encodeURIComponent("rootpass");
const mongo_db_name = "attendance-checker-db";
const mongoDbUrl = `mongodb://${mongo_host}:27017/${mongo_db_name}`;

// MongoDB connection
mongoose
  .connect(mongoDbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log(
      `MongoDB connected, database url: ${mongoDbUrl}, database name: ${mongo_db_name}`
    )
  )
  .catch((err) => console.log(err));

app.use(
  session({
    secret: "abcdefg", // Use a secret for signing the session ID cookie
    resave: false, // Avoid resaving sessions that haven't been modified
    saveUninitialized: false, // Don't create a session until something is stored
    store: MongoStore.create({ mongoUrl: mongoDbUrl }), // Use MongoStore to store session in the database
    cookie: {
      secure: false, // Set secure to true if using https
      httpOnly: true, // Reduce XSS attack vector by not allowing cookies to be accessed through client-side scripts
      maxAge: 1000 * 60 * 60 * 24, // Example for setting cookie to expire after one day
    },
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to Attendance Tracker backend!");
});

app.listen(PORT, () => {
  console.log(`---- Server Starts ----`);
  console.log(`Backend server running on http://localhost:${PORT}`);
});
/**
 * Login API
 */

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body; // Use email instead of userId
  let user = null;

  try {
    user = await User.findOne({ email: email }); // Find user by email

    const isMatch = password === user.password; // This is insecure, just placeholder for demonstration

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Store user's ID in session
    req.session.userId = user._id;

    res.json({
      message: "Login successful",
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Could not log out");
    }
    res.send("Logged out successfully");
  });
});

// Assuming you're using express-session with connect-mongo
app.get("/api/current-user", async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Deconstruct the user object to separate _id and password from the rest
      const { _id, password, ...rest } = user.toObject();

      // Construct userInfo with _id renamed to userId
      const userInfo = { userId: _id, ...rest };

      res.json(userInfo);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  } else {
    res.status(401).json({ message: "No user logged in" });
  }
});

/**
 * User API
 */

app.post("/api/courses", async (req, res) => {
  try {
    const { title, description, instructor, students = [] } = req.body;

    // Initialize course object with mandatory fields
    const courseData = {
      title,
      description,
      students: [],
    };

    // Optionally add instructor if provided and valid
    if (instructor) {
      const instructorExists = await User.findOne({
        _id: instructor,
        role: "instructor",
      });
      if (!instructorExists) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      courseData.instructor = instructor;
    }

    // Validate and add students if provided
    for (let studentId of students) {
      const studentExists = await User.findOne({
        _id: studentId,
        role: "student",
      });
      if (!studentExists) {
        return res
          .status(404)
          .json({ message: `Student not found: ${studentId}` });
      }
      courseData.students.push(studentId);
    }

    const newCourse = new Course(courseData);
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { title, description, instructor, students } = req.body;
    const courseUpdate = {};

    if (title) courseUpdate.title = title;
    if (description) courseUpdate.description = description;

    // Optionally update instructor if provided
    if (instructor) {
      const instructorExists = await User.findOne({
        _id: instructor,
        role: "instructor",
      });
      if (!instructorExists) {
        return res.status(404).json({ message: "Instructor not found" });
      }
      courseUpdate.instructor = instructor;
    }

    // Optionally update students if provided
    if (students) {
      for (let studentId of students) {
        const studentExists = await User.findOne({
          _id: studentId,
          role: "student",
        });
        if (!studentExists) {
          return res
            .status(404)
            .json({ message: `Student not found: ${studentId}` });
        }
      }
      courseUpdate.students = students;
    }

    const course = await Course.findByIdAndUpdate(req.params.id, courseUpdate, {
      new: true,
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Instructor API
 */

app.get("/api/instructors/:instructorId", async (req, res) => {
  try {
    const user = await User.findById(req.params.instructorId);
    if (!user) return res.status(404).json({ message: "Instructor not found" });
    if (user.role !== "instructor")
      return res.status(404).json({ message: "The user is not instructor" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/instructors/:instructorId/courses", async (req, res) => {
  const { instructorId } = req.params;
  try {
    // Validate if the student exists
    const instructorExists = await User.findById(instructorId);
    if (!instructorExists || instructorExists.role !== "instructor") {
      return res.status(404).json({ message: "Instructor not found" });
    }

    // Find all courses where this student is registered
    const courses = await Course.find({ instructor: instructorId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post(
  "/api/classes/:classId/toggle_attendance/:studentId",
  async (req, res) => {
    const { classId, studentId } = req.params;

    try {
      // Find the class document
      const classDoc = await Class.findById(classId);
      if (!classDoc) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Check if the student is in the attendance list
      const attendanceIndex = classDoc.attendance.findIndex(
        (att) => att.student.toString() === studentId
      );

      if (attendanceIndex === -1) {
        // If student not found in the attendance list, add them with attendance toggled
        classDoc.attendance.push({ student: studentId, attends: true });
      } else {
        // If student found, toggle their attendance status
        classDoc.attendance[attendanceIndex].attends =
          !classDoc.attendance[attendanceIndex].attends;
      }

      // Save the updated class document
      await classDoc.save();

      res.json({ message: "Attendance toggled successfully", class: classDoc });
    } catch (error) {
      console.error("Error toggling attendance:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * Student API
 */

app.get("/api/students/:studentId", async (req, res) => {
  try {
    const user = await User.findById(req.params.studentId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "student")
      return res.status(404).json({ message: "The user is not student" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/students/:studentId/courses", async (req, res) => {
  const { studentId } = req.params;
  try {
    // Validate if the student exists
    const studentExists = await User.findById(studentId);
    if (!studentExists || studentExists.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find all courses where this student is registered
    const courses = await Course.find({ students: studentId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get(
  "/api/students/:studentId/courses/:courseId/classes",
  async (req, res) => {
    const { studentId, courseId } = req.params;
    try {
      // Validate if the student is registered in the specified course
      const course = await Course.findOne({
        _id: courseId,
        students: studentId,
      });
      if (!course) {
        return res.status(404).json({
          message:
            "Student is not registered in the specified course or course not found",
        });
      }

      // Find all classes under the course
      const classes = await Class.find({
        course: courseId,
        "attendance.student": studentId,
      });
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

app.post("/api/classes/:classId/attendance/:studentId", async (req, res) => {
  const { classId, studentId } = req.params;

  try {
    // Find the class and ensure it exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if the student is registered in the class's attendance
    const studentAttendanceIndex = classData.attendance.findIndex(
      (att) => att.student.toString() === studentId
    );

    if (studentAttendanceIndex === -1) {
      // Student not found in attendance list
      return res
        .status(404)
        .json({ message: "Student not registered for this class" });
    }

    // Set attendance to true for the student
    classData.attendance[studentAttendanceIndex].attends = true;

    // Save the updated class data
    await classData.save();

    res.json({ message: "Attendance marked as true", classData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Course API
 */

app.post("/api/courses", async (req, res) => {
  try {
    const { title, description, instructor, students } = req.body;
    const newCourse = new Course({ title, description, instructor, students });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor")
      .populate("students");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor")
      .populate("students");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { title, description, instructor, students } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, description, instructor, students },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all classes under a course

app.get("/api/courses/:courseId/classes", async (req, res) => {
  try {
    const { courseId } = req.params;
    const classes = await Class.find({ course: courseId });
    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Class API
 */

app.post("/api/classes", async (req, res) => {
  try {
    const { course, topic } = req.body;

    // Validate course ID and retrieve registered students
    const courseData = await Course.findById(course).populate("students");
    if (!courseData)
      return res.status(404).json({ message: "Course not found" });

    // Use current time for the class date
    const date = new Date();

    // Automatically create attendance records for registered students with status 'false'
    const attendance = courseData.students.map((student) => ({
      student: student._id,
      attends: false,
    }));

    const newClass = new Class({
      course,
      date, // Set to current time
      topic,
      attendance,
    });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/classes", async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("course")
      .populate("attendance.student");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/classes/:id", async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate("course")
      .populate("attendance.student");
    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/classes/:id", async (req, res) => {
  try {
    const { course, topic } = req.body;
    let updateData = { topic };

    if (course) {
      const courseExists = await Course.findById(course).populate("students");
      if (!courseExists)
        return res.status(404).json({ message: "Course not found" });

      updateData.course = course;

      // Update attendance records to include all current students with 'false' status
      updateData.attendance = courseExists.students.map((student) => ({
        student: student._id,
        attends: false,
      }));
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedClass)
      return res.status(404).json({ message: "Class not found" });
    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/classes/:id", async (req, res) => {
  try {
    const classData = await Class.findByIdAndDelete(req.params.id);
    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/classes/:classId/toggle-active", async (req, res) => {
  const { classId } = req.params;

  try {
    // Find the class by ID
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Toggle the active status
    classDoc.active = !classDoc.active;

    // Save the updated class
    await classDoc.save();

    res.json({ message: "Class active status toggled", class: classDoc });
  } catch (error) {
    console.error("Error toggling class active status:", error);
    res.status(500).json({ message: "Server error" });
  }
});
