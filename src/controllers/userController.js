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
    const { email, firebaseId } = req.body;
    if (!firebaseId) {
      throw new Error('Firebase ID is required');
    }
    
    // Ensure firebaseId is unique
    const existingUser = await User.findOne({ firebaseId });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const newUser = new User({ email, firebaseId });
    await newUser.save();
    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Update user
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
      avatar : req.body.avatar,
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


export const checkUserExists = async (req, res) => {
  try {
    const firebaseId = req.params.id;
    const user = await User.findOne({ firebaseId });
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
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