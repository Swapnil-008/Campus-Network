import Company from '../models/company.model.js';
import User from '../models/user.model.js';

// @desc    Create a new company opportunity
export const createCompany = async (req, res) => {
  try {
    // Only TnP admins can create companies
    if (req.user.role !== 'tnp_admin' && req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Only TnP admins can post companies' });
    }

    const { companyName, role, description, packageOffered, eligibility, deadline, formLink } = req.body;

    const company = new Company({
      companyName,
      role,
      description,
      packageOffered,
      eligibility,
      deadline,
      formLink,
      createdBy: req.user.id
    });

    await company.save();
    await company.populate('createdBy', 'name email role');

    res.status(201).json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all companies (filtered for students based on eligibility)
export const getCompanies = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = {};

    // Students see only eligible companies
    if (user.role === 'student') {
      query = {
        isActive: true,
        'eligibility.branches': user.department,
        'eligibility.minCGPA': { $lte: user.cgpa },
        'eligibility.years': user.year,
        deadline: { $gte: new Date() } // Only future deadlines
      };
    } else if (user.role === 'teacher') {
      // Teachers see companies for their department
      query = {
        isActive: true,
        'eligibility.branches': user.department
      };
    }
    // TnP admins and college admins see all companies (no filter)

    const companies = await Company.find(query)
      .populate('createdBy', 'name email role')
      .populate('applications.student', 'name email department year cgpa')
      .sort({ deadline: 1 }); // Sort by deadline (closest first)

    res.json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single company
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('applications.student', 'name email department year cgpa');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Apply to a company
export const applyToCompany = async (req, res) => {
  try {
    // Only students can apply
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply to companies' });
    }

    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if deadline has passed
    if (new Date() > company.deadline) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    // Check if company is active
    if (!company.isActive) {
      return res.status(400).json({ message: 'This opportunity is no longer active' });
    }

    // Check if already applied
    const alreadyApplied = company.applications.some(
      app => app.student.toString() === req.user.id
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this company' });
    }

    // Check eligibility
    const user = await User.findById(req.user.id);

    if (!company.eligibility.branches.includes(user.department)) {
      return res.status(403).json({ message: 'You are not eligible for this company (branch)' });
    }

    if (user.cgpa < company.eligibility.minCGPA) {
      return res.status(403).json({ message: 'You are not eligible for this company (CGPA)' });
    }

    if (!company.eligibility.years.includes(user.year)) {
      return res.status(403).json({ message: 'You are not eligible for this company (year)' });
    }

    // Add application
    company.applications.push({
      student: req.user.id,
      appliedAt: new Date()
    });

    await company.save();

    res.json({ message: 'Application submitted successfully', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update company
export const updateCompany = async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Only creator or admin can update
    if (company.createdBy.toString() !== req.user.id && req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Not authorized to update this company' });
    }

    const { companyName, role, description, packageOffered, eligibility, deadline, formLink, isActive } = req.body;

    company.companyName = companyName || company.companyName;
    company.role = role || company.role;
    company.description = description || company.description;
    company.packageOffered = packageOffered || company.packageOffered;
    company.eligibility = eligibility || company.eligibility;
    company.deadline = deadline || company.deadline;
    company.formLink = formLink || company.formLink;
    company.isActive = isActive !== undefined ? isActive : company.isActive;

    await company.save();
    await company.populate('createdBy', 'name email role');

    res.json(company);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete company
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Only creator or admin can delete
    if (company.createdBy.toString() !== req.user.id && req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Not authorized to delete this company' });
    }

    await company.deleteOne();

    res.json({ message: 'Company deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export applicants list (CSV format)
export const exportApplicants = async (req, res) => {
  try {
    // Only TnP admins can export
    if (req.user.role !== 'tnp_admin' && req.user.role !== 'college_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const company = await Company.findById(req.params.id)
      .populate('applications.student', 'name email department year cgpa');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Format data for CSV
    const applicants = company.applications.map(app => ({
      name: app.student.name,
      email: app.student.email,
      department: app.student.department,
      year: app.student.year,
      cgpa: app.student.cgpa,
      appliedAt: app.appliedAt
    }));

    res.json(applicants);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Close expired companies (can be called via cron job)
export const closeExpiredCompanies = async (req, res) => {
  try {
    const result = await Company.updateMany(
      { deadline: { $lt: new Date() }, isActive: true },
      { isActive: false }
    );

    res.json({ message: `${result.modifiedCount} companies closed` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};