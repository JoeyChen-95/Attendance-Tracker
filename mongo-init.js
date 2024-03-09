db = new Mongo().getDB("attendance-checker-db");

db.createUser({
  user: "admin",
  pwd: "password", // or use environment variables
  roles: [
    {
      role: "readWrite",
      db: "mydatabase",
    },
  ],
});

db.createCollection("users");
db.createCollection("courses");
db.createCollection("classes");

db.users.insertMany([
  {
    name: "Alice",
    email: "alice@example.com",
    password: "123",
    role: "student",
  },
  {
    name: "Bob",
    email: "bob@example.com",
    password: "456",
    role: "instructor",
  },
]);

// Create the 'courses' collection and insert initial documents
// Assuming the instructor's ObjectId is known or can be queried
let bobId = db.users.findOne({ name: "Bob" })._id;
let aliceId = db.users.findOne({ name: "Alice" })._id;

db.courses.insertMany([
  {
    title: "Database Systems",
    description: "Learn about databases",
    instructor: bobId, // Use ObjectId, not the entire document
    students: [aliceId], // Array of ObjectIds
  },
  {
    title: "Machine Learning",
    description: "Intro to ML",
    instructor: bobId,
    students: [aliceId],
  },
]);

let databaseSystemId = db.courses.findOne({ title: "Database Systems" })._id;

db.classes.insertMany([
  {
    course: databaseSystemId, // Use ObjectId
    date: new Date(),
    topic: "Introduction to Databases",
    attendance: [{ student: aliceId, attends: false }],
    active: true,
  },
  {
    course: databaseSystemId, // Use ObjectId
    date: new Date(),
    topic: "SQL Basics",
    attendance: [{ student: aliceId, attends: false }],
    active: true,
  },
]);
