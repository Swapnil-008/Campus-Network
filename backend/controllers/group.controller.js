import Group from '../models/group.model.js';
import User from '../models/user.model.js';

// @desc    Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, type, settings } = req.body;

    const group = new Group({
      name,
      description,
      type,
      createdBy: req.user.id,
      admins: [req.user.id],
      members: [req.user.id],
      settings: settings || {}
    });

    await group.save();
    await group.populate('createdBy members admins', 'name email department role');

    res.status(201).json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all groups user is part of
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id,
      isActive: true
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email department')
      .populate('admins', 'name email')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single group
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy members admins pendingRequests', 'name email department role');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search/browse all groups
export const searchGroups = async (req, res) => {
  try {
    const { search, type } = req.query;

    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const groups = await Group.find(query)
      .populate('createdBy', 'name email')
      .select('name description type members createdBy settings')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join a group
export const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if already a member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    // Check if requires approval
    if (group.settings.requireApproval) {
      // Add to pending requests
      if (!group.pendingRequests.includes(req.user.id)) {
        group.pendingRequests.push(req.user.id);
        await group.save();
      }
      return res.json({ message: 'Join request sent. Waiting for admin approval.' });
    }

    // Add directly
    group.members.push(req.user.id);
    await group.save();
    await group.populate('members', 'name email department');

    res.json({ message: 'Joined group successfully', group });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Leave a group
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Can't leave if you're the only admin
    if (group.admins.length === 1 && group.admins[0].toString() === req.user.id) {
      return res.status(400).json({ 
        message: 'You are the only admin. Please assign another admin before leaving.' 
      });
    }

    // Remove from members and admins
    group.members = group.members.filter(m => m.toString() !== req.user.id);
    group.admins = group.admins.filter(a => a.toString() !== req.user.id);

    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve join request
export const approveJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if requester is admin
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can approve requests' });
    }

    // Add user to members
    if (!group.members.includes(userId)) {
      group.members.push(userId);
    }

    // Remove from pending
    group.pendingRequests = group.pendingRequests.filter(
      id => id.toString() !== userId
    );

    await group.save();
    await group.populate('members pendingRequests', 'name email department');

    res.json({ message: 'User approved', group });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove member from group
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if requester is admin
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    // Can't remove other admins
    if (group.admins.includes(userId)) {
      return res.status(400).json({ message: 'Cannot remove an admin. Remove admin rights first.' });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();

    res.json({ message: 'Member removed', group });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Make user admin
export const makeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if requester is admin
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can assign admin rights' });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is not a member' });
    }

    // Add to admins if not already
    if (!group.admins.includes(userId)) {
      group.admins.push(userId);
      await group.save();
    }

    await group.populate('admins', 'name email department');

    res.json({ message: 'Admin rights granted', group });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove admin rights
export const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if requester is creator
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group creator can remove admin rights' });
    }

    // Can't remove creator's admin rights
    if (userId === group.createdBy.toString()) {
      return res.status(400).json({ message: 'Cannot remove creator admin rights' });
    }

    group.admins = group.admins.filter(a => a.toString() !== userId);
    await group.save();

    res.json({ message: 'Admin rights removed', group });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update group settings
export const updateGroupSettings = async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if requester is admin
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can update settings' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (settings) group.settings = { ...group.settings, ...settings };

    await group.save();

    res.json({ message: 'Group updated', group });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete group
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group creator can delete' });
    }

    await group.deleteOne();

    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};