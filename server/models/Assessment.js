const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index into options array
  points: { type: Number, default: 1 },
});

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['coding', 'quiz'],
      default: 'coding',
    },
    // Coding challenge fields
    codingQuestions: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        initialCode: {
          type: Object,
          default: {},
        },
        testCases: [
          {
            input: { type: String },
            expectedOutput: { type: String },
            isHidden: { type: Boolean, default: false }
          }
        ]
      }
    ],
    // Quiz fields
    questions: {
      type: [questionSchema],
      default: [],
    },
    // Shared fields
    timeLimit: {
      type: Number, // in minutes, 0 = unlimited
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assessment', assessmentSchema);

