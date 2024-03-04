// models/Course.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: Schema.Types.ObjectId, ref: "User" },
  students: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Course", CourseSchema);
