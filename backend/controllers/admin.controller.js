import User from '../models/user.model.js';
import Company from '../models/company.model.js';
import Announcement from '../models/announcement.model.js';

export const getAllUsers = async (req, res) => {
  try {
    // Only college admins can access
    if (req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.query; // ?status=pending or ?status=approved

    let query = {};
    if (status === 'pending') {
      query = { isApproved: false, role: { $ne: 'student' } }; // Non-students pending approval
    } else if (status === 'approved') {
      query = { isApproved: true };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveUser = async (req, res) => {
    try {
        if(req.user.role !== 'college_admin') {
            return res.status(403).json({message: 'Access denied'});
        }

        const user = await User.findById(req.params.id);

        if(!user) {
            return res.status(404).json({message: 'User not found'});
        }

        user.isApproved = true;
        await user.save();

        res.json({message: 'User approved successfully'});
    } catch(err) {
        console.error(err.message);
        res.status(500).json({message: 'Server error'});
    }
};

export const deleteUser = async (req, res) => {
    try {
        if(req.user.role !== 'college_admin') {
            return res.status(403).json({message: 'Access denied'});
        }

        const user = await User.findById(req.params.id);

        if(!user) {
            return res.status(404).json({message: 'User not found'});
        }

        // Don't allow deleting yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();

        res.json({message: 'User deleted successfully'});
    } catch(err) {
        console.error(err.message);
        res.status(500).json({message: "Server error"});
    }
}

// @desc Update user role
export const updateUserRole = async (req, res) => {
    try {
        if (req.user.role !== 'college_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { role, department } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role || user.role;
        user.department = department || user.department;

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get platform statistics
export const getStatistics = async (req, res) => {
    try {
        if (req.user.role !== 'college_admin' && req.user.role !== 'tnp_admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalTeachers = await User.countDocuments({ role: 'teacher' });
        const pendingApprovals = await User.countDocuments({ isApproved: false, role: { $ne: 'student' } });
        
        const totalAnnouncements = await Announcement.countDocuments();
        const totalCompanies = await Company.countDocuments();
        const activeCompanies = await Company.countDocuments({ isActive: true, deadline: { $gte: new Date() } });
        
        // Total applications
        const companies = await Company.find();
        const totalApplications = companies.reduce((sum, company) => sum + company.applications.length, 0);

        // Department-wise breakdown
        const departmentBreakdown = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        res.json({
            users: {
                total: totalUsers,
                students: totalStudents,
                teachers: totalTeachers,
                pendingApprovals
            },
            content: {
                announcements: totalAnnouncements,
                companies: totalCompanies,
                activeCompanies,
                totalApplications
            },
            departmentBreakdown
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};