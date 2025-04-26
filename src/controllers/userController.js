import User from "../models/userModel.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getUsers = async (req, res) => {
  try {
    console.log("Query:", req.query.search);
    const searchQuery = req.query.search || "";
    const users = await User.find({
      $or: [{ name: { $regex: searchQuery, $options: "i" } }],
    });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// @desc    Get single user
// @route   GET /api/users/:id

// @access  Public
export const getUser = async (req, res) => {
  try {
    console.log(req.params.id);
    const user = await User.findOne({ firebaseId: req.params.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// @desc    Create new user
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
  try {
    const { email, firebaseId, fcmToken } = req.body;
    if (!firebaseId) {
      throw new Error("Firebase ID is required");
    }

    // Ensure firebaseId is unique
    const existingUser = await User.findOne({ firebaseId });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ email, firebaseId, fcmToken });
    await newUser.save();
    res.json({ success: true, data: newUser });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
export const updateUser = async (req, res) => {
  try {
    const firebaseId = req.params.id;

    const updateData = {
      name: req.body.name,
      height: req.body.height,
      weight: req.body.weight,
      gender: req.body.gender,
      preferredSize: req.body.preferredSize,
      avatar: req.body.avatar,
      completedProfile: true,
    };
    const updatedUser = await User.findOneAndUpdate(
      { firebaseId: firebaseId },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    console.log("======>", error);
  }
};

export const checkUserExists = async (req, res) => {
  try {
    const firebaseId = req.params.id;
    const user = await User.findOne({ firebaseId });
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const updateFcmToken = async (req, res) => {
  try {
    const { firebaseId } = req.params
    const { fcmToken } = req.body
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      })
    }
    
    const user = await User.findOne({ firebaseId })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }
    
    // Update the FCM token
    user.fcmToken = fcmToken
    await user.save()
    
    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error updating FCM token:', error)
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    })
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const addFriend = async (req, res) => {
  try {
    console.log("=========addFriend========>", req.params.id, req.body);
    const userId = req.params.id;
    const { friendId } = req.body;

    // Validate inputs
    if (!userId || !friendId) {
      return res.status(400).json({
        success: false,
        message: "User ID and friend ID are required",
      });
    }

    // Check if both users exist
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({
        success: false,
        message: "User or friend not found",
      });
    }

    // Check if friend is already added
    if (user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend already added",
      });
    }

    // Add friend to user's friends list
    user.friends.push(friendId);
    await user.save();

    // Optionally, add the user to the friend's friends list (bidirectional friendship)
    friend.friends.push(userId);
    await friend.save();

    res.status(200).json({
      success: true,
      message: "Friend added successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const userId = req.params.id;
    const { friendId } = req.body;

    // Validate inputs
    if (!userId || !friendId) {
      return res.status(400).json({
        success: false,
        message: "User ID and friend ID are required",
      });
    }

    // Check if both users exist
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({
        success: false,
        message: "User or friend not found",
      });
    }

    // Check if friend exists in user's friends list
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Friend not in friends list",
      });
    }

    // Remove friend from user's friends list
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    await user.save();

    // Optionally, remove the user from the friend's friends list
    friend.friends = friend.friends.filter((id) => id.toString() !== userId);
    await friend.save();

    res.status(200).json({
      success: true,
      message: "Friend removed successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).populate(
      "friends",
      "name email avatar fcmToken"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.friends.length,
      data: user.friends,
    });
  } catch (error) {
    console.error("Error getting user friends:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
