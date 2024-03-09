const mongoose = require("mongoose");
const { Schema } = mongoose;

const ClassSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  date: { type: Date, required: true },
  topic: { type: String, required: true },
  attendance: [
    {
      student: { type: Schema.Types.ObjectId, ref: "User" },
      attends: { type: Boolean, required: true },
    },
  ],
  active: { type: Boolean, required: true, default: true },
  secretCode: { type: String, required: true },
});

module.exports = mongoose.model("Class", ClassSchema);
