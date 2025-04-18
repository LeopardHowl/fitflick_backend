// // server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const db = require('./firebase'); // Firebase RTDB
// const Message = require('./models/Message'); // MongoDB model

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// // MongoDB connection
// mongoose.connect('mongodb://localhost:27017/chatapp', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// console.log('MongoDB connected');

// // API route to send a message
// app.post('/api/messages', async (req, res) => {
//   const { senderId, receiverId, content } = req.body;
//   const timestamp = Date.now();

//   try {
//     // 1. Save to MongoDB
//     const message = await Message.create({
//       senderId,
//       receiverId,
//       content,
//       timestamp,
//     });

//     // 2. Push to Firebase RTDB
//     await db.ref(`chats/${receiverId}/${message._id}`).set({
//       senderId,
//       receiverId,
//       content,
//       timestamp,
//       messageId: message._id.toString(),
//     });

//     res.status(200).json({ success: true, message });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(3000, () => {
//   console.log('Server running on http://localhost:3000');
// });

import firebaseDb from "../config/firebase.js";
import Message from "../models/messageModel.js";

export const sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  const timestamp = Date.now();

  console.log("This is the request body:", req.body);

  try {
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      timestamp,
    });

    await firebaseDb.ref(`chats/${receiverId}/${message._id}`).set({
      senderId,
      receiverId,
      content,
      timestamp,
      messageId: message._id.toString(),
    });

    res.status(200).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
