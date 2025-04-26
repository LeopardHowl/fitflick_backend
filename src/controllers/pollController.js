import Poll from "../models/pollModel.js";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import firebaseDb from "../config/firebase.js";
import admin from "firebase-admin";
import mongoose from "mongoose";

/**
 * @desc    Create a new poll
 * @route   POST /api/polls
 * @access  Private
 */
export const createPoll = async (req, res) => {
  try {
    const { question, image, creator, groupId, endDate } = req.body;

    // Validate creator exists
    const creatorUser = await User.findById(creator);
    if (!creatorUser) {
      return res.status(404).json({
        success: false,
        error: "Creator user not found",
      });
    }

    // Validate group exists if provided
    let group = null;
    if (groupId) {
      group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: "Group not found",
        });
      }

      // Check if creator is a member of the group
      if (!group.members.includes(creator)) {
        return res.status(403).json({
          success: false,
          error: "Creator must be a member of the group",
        });
      }
    }

    // Create poll
    const poll = await Poll.create({
      question,
      image,
      creator,
      votes: [],
      isActive: true,
      endDate: endDate || null,
    });

    // If group is provided, add poll to group
    if (group) {
      group.polls.push(poll._id);
      await group.save();
    }

    // Create Firebase entry for real-time updates
    await firebaseDb.ref(`polls/${poll._id.toString()}`).set({
      id: poll._id.toString(),
      question,
      image,
      creator,
      votes: [],
      isActive: true,
      endDate: endDate || null,
      createdAt: Date.now(),
      totalVotes: 0,
      averageScore: 0,
    });

    // If poll is in a group, notify group members
    if (group) {
      for (const memberId of group.members) {
        if (memberId.toString() !== creator) { // Don't notify the creator
          const memberToken = await getUserFCMToken(memberId.toString());
          if (memberToken) {
            await admin.messaging().send({
              token: memberToken,
              notification: {
                title: "New Poll in " + group.name,
                body: `${creatorUser.name} created a new poll: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`,
              },
              data: {
                pollId: poll._id.toString(),
                groupId: group._id.toString(),
                type: "new_poll",
                imageUrl: image,
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
    }

    res.status(201).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create poll",
    });
  }
};

/**
 * @desc    Get all polls
 * @route   GET /api/polls
 * @access  Private
 */
export const getPolls = async (req, res) => {
  try {
    const { groupId, creatorId, isActive } = req.query;
    let query = {};

    // Filter by group if provided
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: "Group not found",
        });
      }
      query = { _id: { $in: group.polls } };
    }

    // Filter by creator if provided
    if (creatorId) {
      query.creator = creatorId;
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const polls = await Poll.find(query)
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch polls",
    });
  }
};

/**
 * @desc    Get a single poll by ID
 * @route   GET /api/polls/:id
 * @access  Private
 */
export const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar");

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: "Poll not found",
      });
    }

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch poll",
    });
  }
};

/**
 * @desc    Vote on a poll
 * @route   POST /api/polls/:id/vote
 * @access  Private
 */
export const votePoll = async (req, res) => {
  try {
    const { voter, score, content } = req.body;
    const pollId = req.params.id;

    // Validate score
    if (score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: "Score must be between 1 and 5",
      });
    }

    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: "Poll not found",
      });
    }

    // Check if poll is active
    if (!poll.isActive) {
      return res.status(400).json({
        success: false,
        error: "Poll is no longer active",
      });
    }

    // Check if end date has passed
    if (poll.endDate && new Date(poll.endDate) < new Date()) {
      poll.isActive = false;
      await poll.save();
      
      return res.status(400).json({
        success: false,
        error: "Poll has ended",
      });
    }

    // Check if user exists
    const user = await User.findById(voter);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Check if user has already voted
    const existingVoteIndex = poll.votes.findIndex(
      (vote) => vote.voter.toString() === voter
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      poll.votes[existingVoteIndex] = {
        voter,
        score,
        content: content || "",
        votedAt: Date.now(),
      };
    } else {
      // Add new vote
      poll.votes.push({
        voter,
        score,
        content: content || "",
        votedAt: Date.now(),
      });
    }

    await poll.save();

    // Find groups containing this poll
    const groups = await Group.find({ polls: pollId });

    // Update Firebase
    const updatedPoll = await Poll.findById(pollId)
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar");

    // Format votes for Firebase
    const formattedVotes = updatedPoll.votes.map(vote => ({
      voter: vote.voter._id.toString(),
      voterName: vote.voter.name,
      voterAvatar: vote.voter.avatar,
      score: vote.score,
      content: vote.content,
      votedAt: vote.votedAt.getTime(),
    }));

    await firebaseDb.ref(`polls/${pollId}`).update({
      votes: formattedVotes,
      totalVotes: updatedPoll.totalVotes,
      averageScore: updatedPoll.averageScore,
      updatedAt: Date.now(),
    });

    // Notify poll creator
    if (poll.creator.toString() !== voter) {
      const creatorToken = await getUserFCMToken(poll.creator.toString());
      if (creatorToken) {
        await admin.messaging().send({
          token: creatorToken,
          notification: {
            title: "New Vote on Your Poll",
            body: `${user.name} rated your outfit ${score}/5`,
          },
          data: {
            pollId: poll._id.toString(),
            type: "poll_vote",
            score: score.toString(),
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

    // Notify group members about the vote
    for (const group of groups) {
      for (const memberId of group.members) {
        if (memberId.toString() !== voter && memberId.toString() !== poll.creator.toString()) {
          const memberToken = await getUserFCMToken(memberId.toString());
          if (memberToken) {
            await admin.messaging().send({
              token: memberToken,
              notification: {
                title: "New Vote in " + group.name,
                body: `${user.name} rated an outfit ${score}/5`,
              },
              data: {
                pollId: poll._id.toString(),
                groupId: group._id.toString(),
                type: "poll_vote_update",
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
    }

    res.status(200).json({
      success: true,
      data: updatedPoll,
    });
  } catch (error) {
    console.error("Error voting on poll:", error);
    res.status(500).json({
      success: false,
      error: "Failed to vote on poll",
    });
  }
};

/**
 * @desc    Update a poll
 * @route   PUT /api/polls/:id
 * @access  Private
 */
export const updatePoll = async (req, res) => {
  try {
    const { question, image, isActive, endDate } = req.body;
    const pollId = req.params.id;

    // Check if poll exists
    let poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: "Poll not found",
      });
    }

    // Check if user is the creator
    if (req.body.userId && req.body.userId !== poll.creator.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the creator can update this poll",
      });
    }

    // Update poll
    poll = await Poll.findByIdAndUpdate(
      pollId,
      {
        question: question || poll.question,
        image: image || poll.image,
        isActive: isActive !== undefined ? isActive : poll.isActive,
        endDate: endDate || poll.endDate,
      },
      { new: true, runValidators: true }
    )
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar");

    // Update Firebase
    await firebaseDb.ref(`polls/${pollId}`).update({
      question: question || poll.question,
      image: image || poll.image,
      isActive: isActive !== undefined ? isActive : poll.isActive,
      endDate: endDate || poll.endDate,
      updatedAt: Date.now(),
    });

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error("Error updating poll:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update poll",
    });
  }
};

/**
 * @desc    Delete a poll
 * @route   DELETE /api/polls/:id
 * @access  Private
 */
export const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: "Poll not found",
      });
    }

    // Check if user is the creator
    if (req.body.userId && req.body.userId !== poll.creator.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the creator can delete this poll",
      });
    }

    // Remove poll from any groups
    await Group.updateMany(
      { polls: req.params.id },
      { $pull: { polls: req.params.id } }
    );

    // Delete poll
    await Poll.findByIdAndDelete(req.params.id);

    // Delete from Firebase
    await firebaseDb.ref(`polls/${req.params.id}`).remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error("Error deleting poll:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete poll",
    });
  }
};

/**
 * @desc    Close a poll
 * @route   PUT /api/polls/:id/close
 * @access  Private
 */
export const closePoll = async (req, res) => {
  try {
    const pollId = req.params.id;

    // Check if poll exists
    let poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: "Poll not found",
      });
    }

    // Check if user is the creator
    if (req.body.userId && req.body.userId !== poll.creator.toString()) {
      return res.status(403).json({
        success: false,
        error: "Only the creator can close this poll",
      });
    }

    // Close poll
    poll.isActive = false;
    await poll.save();

    // Update Firebase
    await firebaseDb.ref(`polls/${pollId}`).update({
      isActive: false,
      updatedAt: Date.now(),
    });

    res.status(200).json({
      success: true,
      data: poll,
    });
  } catch (error) {
    console.error("Error closing poll:", error);
    res.status(500).json({
      success: false,
      error: "Failed to close poll",
    });
  }
};

/**
 * @desc    Get poll results
 * @route   GET /api/polls/:id/results
 * @access  Private
 */
export const getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar");

    if (!poll) {
      return res.status(404).json({
        success: false,
        error: "Poll not found",
      });
    }

    // Calculate results
    const totalVotes = poll.votes.length;
    const averageScore = poll.averageScore;
    
    // Score distribution
    const scoreDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };
    
    poll.votes.forEach(vote => {
      scoreDistribution[vote.score]++;
    });

    // Format results
    const results = {
      pollId: poll._id,
      question: poll.question,
      image: poll.image,
      creator: poll.creator,
      totalVotes,
      averageScore,
      scoreDistribution,
      votes: poll.votes,
      isActive: poll.isActive,
      endDate: poll.endDate,
      createdAt: poll.createdAt
    };

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching poll results:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch poll results",
    });
  }
};

/**
 * @desc    Get user's polls
 * @route   GET /api/polls/user/:userId
 * @access  Private
 */
export const getUserPolls = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get polls created by user
    const polls = await Poll.find({ creator: userId })
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error("Error fetching user polls:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user polls",
    });
  }
};

/**
 * @desc    Get polls user has voted on
 * @route   GET /api/polls/voted/:userId
 * @access  Private
 */
export const getVotedPolls = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get polls voted by user
    const polls = await Poll.find({ "votes.voter": userId })
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error("Error fetching voted polls:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch voted polls",
    });
  }
};

/**
 * @desc    Get group polls
 * @route   GET /api/polls/group/:groupId
 * @access  Private
 */
export const getGroupPolls = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // Get polls in the group
    const polls = await Poll.find({ _id: { $in: group.polls } })
      .populate("creator", "name email avatar")
      .populate("votes.voter", "name email avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls,
    });
  } catch (error) {
    console.error("Error fetching group polls:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group polls",
    });
  }
};

// Helper function to get user FCM token
async function getUserFCMToken(userId) {
  const user = await User.findById(userId);
  return user ? user.fcmToken : null;
}