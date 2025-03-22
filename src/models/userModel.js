import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseId: {
    type: String,
    required: [true, 'Please add a firebase ID'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  name: {
    type: String,
    required: [false, 'Please add a name'],
  },
  height: {
    type: Number,
    required: [false, 'Please add height'],
  },
  weight: {
    type: Number,
    required: [false, 'Please add weight'],
  },
  gender: {
    type: String,
    required: [false, 'Please add gender'],
  },
  preferredSize: {
    type: String,
    required: [false, 'Please add preferred size'],
  },
  completedProfile: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

export default User;