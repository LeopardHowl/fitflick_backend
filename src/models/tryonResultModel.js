import mongoose from "mongoose"

const TryonResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
 
}, {timestamps: true});


const TryonResult =mongoose.model("TryonResult", TryonResultSchema);

export default TryonResult;
