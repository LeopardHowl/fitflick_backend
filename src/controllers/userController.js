import User from '../models/userModel.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
export const getUser = async (req, res) => {
  try {
    console.log("============================>", req.params.id);
    const user = await User.findOne({ firebaseId: req.params.id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
// @desc    Create new user
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    
    if (existingUser) {
      // Update existing user
      const updatedUser = await User.findOneAndUpdate(
        { email: req.body.email },
        req.body,
        { 
          new: true,
          runValidators: true
        }
      );
      
      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    }
    
    // Create new user if doesn't exist
    const user = await User.create(req.body);
    
    console.log("======================🌹😍======>", user);
    
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("User creation error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate email address or Firebase ID',
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
export const updateUser = async (req, res) => {
  try {
   console.log("============================>", req.body);
    const firebaseId = req.params.id
 

    const updateData = {
      name: req.body.name,
      height: req.body.height,
      weight: req.body.weight,
      gender: req.body.gender,
      preferredSize: req.body.preferredSize,
      completedProfile: true
    };
    const updatedUser = await User.findOneAndUpdate(
      
      { firebaseId: firebaseId },
      updateData,
      { 
        new: true,        // Return the updated document
        runValidators: true // Run schema validators
      }
    );
    
    if (!updatedUser) {
      console.log("=======================5555555=====>", updatedUser);

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
    });
    console.log("=======================55=====>", updatedUser);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    console.log("======================34343======>", error);
  }
};


// export const checkUserExists = async (req, res) => {
//   try {
//     const firebaseId = req.params.id;
//     const user = await User.findOne({ firebaseId });
//     return !!user;
//   } catch (error) {
//     console.error('Error checking user existence:', error);
//     return false;
//   }
// };
// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};