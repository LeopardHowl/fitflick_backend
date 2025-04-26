import mongoose from "mongoose"
import bcrypt from "bcryptjs"


const AdminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "editor"],
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving
AdminUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
AdminUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}


const adminUserModel= mongoose.model("AdminUser", AdminUserSchema)

export default adminUserModel



