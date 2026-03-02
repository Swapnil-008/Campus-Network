import Announcement from '../models/announcement.model.js';
import User from '../models/user.model.js';
import { createBulkNotifications } from './notification.controller.js';

// Helper to escape regex special characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Create a new announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, visibility, priority, attachments, deadline } = req.body;

    // Only teachers, TnP admins, and college admins can create announcements
    if (!['teacher', 'tnp_admin', 'college_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create announcements' });
    }

    const announcement = new Announcement({
      title,
      description,
      visibility,
      priority: priority || 'normal',
      attachments: attachments || [],
      deadline: deadline || null,
      createdBy: req.user.id
    });

    await announcement.save();

    // Populate creator info
    await announcement.populate('createdBy', 'name email role department');

    let recipientQuery = {};

    if (visibility.type === 'global') {
      // Notify all users
      recipientQuery = {};
    } else if (visibility.type === 'department') {
      // Notify users in specific departments
      recipientQuery = { department: { $in: visibility.departments } };
    }

    const recipients = await User.find(recipientQuery).select('_id');
    const recipientIds = recipients.map(user => user._id);

    // Create notification for all recipients
    await createBulkNotifications(
      recipientIds,
      'announcement',
      `New ${priority} announcement`,
      title,
      '/announcements',
      announcement._id
    );

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all announcements for current user
export const getAnnouncements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get query parameters for search, filter, and pagination
    const { search, priority, department, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // Filter based on user's department
    if (user.role === 'student' || user.role === 'teacher') {
      query = {
        $or: [
          { 'visibility.type': 'global' },
          {
            'visibility.type': 'department',
            'visibility.departments': user.department
          }
        ]
      };
    } else {
      // TnP admins and college admins see all announcements
      query = {};
    }

    // add search filter
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: escapeRegex(search), $options: 'i' } },
          { description: { $regex: escapeRegex(search), $options: 'i' } }
        ]
      });
    }

    // Add priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Add department filter (for admins)
    if (department && department !== 'all') {
      query['visibility.departments'] = department;
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('createdBy', 'name email role department')
        .sort({ priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Announcement.countDocuments(query)
    ]);

    res.json({
      data: announcements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single announcement
export const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email role department');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark announcement as read
export const markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Add user to readBy array if not already present
    if (!announcement.readBy.includes(req.user.id)) {
      announcement.readBy.push(req.user.id);
      await announcement.save();
    }

    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update announcement
export const updateAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is the creator or admin
    if (announcement.createdBy.toString() !== req.user.id && req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Not authorized to update this announcement' });
    }

    const { title, description, visibility, priority, attachments, deadline } = req.body;

    announcement.title = title || announcement.title;
    announcement.description = description || announcement.description;
    announcement.visibility = visibility || announcement.visibility;
    announcement.priority = priority || announcement.priority;
    announcement.attachments = attachments || announcement.attachments;
    announcement.deadline = deadline || announcement.deadline;

    await announcement.save();
    await announcement.populate('createdBy', 'name email role department');

    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is the creator or admin
    if (announcement.createdBy.toString() !== req.user.id && req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await announcement.deleteOne();

    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};