import mongoose from "mongoose";

const backgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, 
    minlength: 3, 
    maxlength: 100,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  isActive:{
    type:String,
    required: true,
  }
}, {timestamps: true});

const Backgournd=mongoose.model("Background", backgroundSchema);

export default Backgournd;