import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Poll question is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Poll image is required"],
    },
    votes: [
      {
        voter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        content: { type: String, trime: true },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for total votes
pollSchema.virtual("totalVotes").get(function () {
  return this.votes.length;
});

// Count average score
pollSchema.virtual("averageScore").get(function () {
  const totalScore = this.votes.reduce((acc, vote) => acc + vote.score, 0);
  return totalScore / this.votes.length;
});

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
