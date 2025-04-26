import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import firebaseDb from "../config/firebase.js";
import admin from "firebase-admin";
import mongoose from "mongoose";

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 * @access  Private
 */
export const createGroup = async (req, res) => {
  try {
    const { name, photo, members, owner } = req.body;
    console.log("This is req.body", name, photo, members, owner);

    // Validate owner exists
    const adminUser = await User.findById(owner);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: "Admin user not found",
      });
    }

    // Validate members exist
    const memberIds = [...new Set([...members, owner])]; // Ensure owner is included in members
    const foundMembers = await User.find({ _id: { $in: memberIds } });

    if (foundMembers.length !== memberIds.length) {
      return res.status(400).json({
        success: false,
        error: "One or more members not found",
      });
    }

    const group = await Group.create({
      name,
      photo,
      members: memberIds,
      owner,
      polls: [],
    });

    // Create Firebase entry for real-time updates
    await firebaseDb.ref(`groups/${group._id.toString()}`).set({
      id: group._id.toString(),
      name,
      photo,
      members: memberIds,
      owner,
      createdAt: Date.now(),
    });

    // Notify members about new group
    for (const memberId of memberIds) {
      if (memberId !== owner) {
        // Don't notify the owner who created the group
        const memberToken = await getUserFCMToken(memberId);
        console.log("memberToken", memberToken);
        if (memberToken) {
          await admin.messaging().send({
            token: memberToken,
            notification: {
              title: "New Group Invitation",
              body: `You've been added to ${name} by ${adminUser.name}`,
            },
            data: {
              groupId: group._id.toString(),
              type: "group_invitation",
            },
            android: {
              priority: "high",
            },
            apns: {
              payload: { aps: { contentAvailable: true } },
            },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create group",
    });
  }
};

/**
 * @desc    Get all groups for a user
 * @route   GET /api/groups
 * @access  Private
 */
export const getGroups = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const groups = await Group.find({ members: userId })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch groups",
    });
  }
};

/**
 * @desc    Get a single group by ID
 * @route   GET /api/groups/:id
 * @access  Private
 */
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .populate({
        path: "polls",
        populate: [
          { path: "creator", select: "name email avatar" },
          {
            path: "votes.voter",
            select: "name email avatar",
          },
        ],
      });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group",
    });
  }
};

/**
 * @desc    Update a group
 * @route   PUT /api/groups/:id
 * @access  Private
 */
export const updateGroup = async (req, res) => {
  try {
    const { name, photo, members, owner } = req.body;
    const groupId = req.params.id;

    // Check if group exists
    let group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Validate owner exists if provided
    if (owner) {
      const adminUser = await User.findById(owner);
      if (!adminUser) {
        return res.status(404).json({
          success: false,
          error: "Admin user not found",
        });
      }
    }

    // Validate members exist if provided
    if (members && members.length > 0) {
      const memberIds = [
        ...new Set([...(members || []), owner || group.owner]),
      ];
      const foundMembers = await User.find({ _id: { $in: memberIds } });

      if (foundMembers.length !== memberIds.length) {
        return res.status(400).json({
          success: false,
          error: "One or more members not found",
        });
      }
    }

    // Update group
    group = await Group.findByIdAndUpdate(
      groupId,
      {
        name: name || group.name,
        photo: photo || group.photo,
        members: members || group.members,
        owner: owner || group.owner,
      },
      { new: true, runValidators: true }
    )
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    // Update Firebase entry
    await firebaseDb.ref(`groups/${groupId}`).update({
      name: name || group.name,
      photo: photo || group.photo,
      members: members || group.members.map((m) => m.toString()),
      owner: owner || group.owner.toString(),
      updatedAt: Date.now(),
    });

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update group",
    });
  }
};

/**
 * @desc    Delete a group
 * @route   DELETE /api/groups/:id
 * @access  Private
 */
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if user is owner
    if (req.body.userId && req.body.userId !== group.owner.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the group owner can delete this group",
      });
    }

    await Group.findByIdAndDelete(req.params.id);

    // Delete from Firebase
    await firebaseDb.ref(`groups/${req.params.id}`).remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete group",
    });
  }
};

/**
 * @desc    Add member to group
 * @route   POST /api/groups/:id/members
 * @access  Private
 */
export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const groupId = req.params.id;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: "User is already a member of this group",
      });
    }

    // Add member to group
    group.members.push(userId);
    await group.save();

    // Update Firebase
    await firebaseDb
      .ref(`groups/${groupId}/members`)
      .set([...group.members.map((m) => m.toString())]);

    // Notify the new member
    const adminUser = await User.findById(group.owner);
    const memberToken = await getUserFCMToken(userId);
    if (memberToken) {
      await admin.messaging().send({
        token: memberToken,
        notification: {
          title: "New Group Invitation",
          body: `You've been added to ${group.name} by ${adminUser.name}`,
        },
        data: {
          groupId: group._id.toString(),
          type: "group_invitation",
        },
        android: {
          priority: "high",
        },
        apns: {
          payload: { aps: { contentAvailable: true } },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add member",
    });
  }
};

/**
 * @desc    Remove member from group
 * @route   DELETE /api/groups/:id/members/:userId
 * @access  Private
 */
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const groupId = req.params.id;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: "User is not a member of this group",
      });
    }

    // Check if user is owner (owner cannot be removed)
    if (group.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: "Admin cannot be removed from the group",
      });
    }

    // Remove member from group
    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );
    await group.save();

    // Update Firebase
    await firebaseDb
      .ref(`groups/${groupId}/members`)
      .set([...group.members.map((m) => m.toString())]);

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove member",
    });
  }
};

// Helper function to get user FCM token
async function getUserFCMToken(userId) {
  const user = await User.findById(userId);
  return user ? user.fcmToken : null;
}
