import express from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  applyToCompany,
  updateCompany,
  deleteCompany,
  exportApplicants,
  closeExpiredCompanies
} from '../controllers/company.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

// @route   POST /api/companies
// @access  Private (TnP Admin only)
router.post('/', auth, createCompany);

// @route   GET /api/companies
// @access  Private
router.get('/', auth, getCompanies);

// @route   GET /api/companies/:id
// @access  Private
router.get('/:id', auth, getCompanyById);

// @route   POST /api/companies/:id/apply
// @access  Private (Students only)
router.post('/:id/apply', auth, applyToCompany);

// @route   PUT /api/companies/:id
// @access  Private (Creator or Admin)
router.put('/:id', auth, updateCompany);

// @route   DELETE /api/companies/:id
// @access  Private (Creator or Admin)
router.delete('/:id', auth, deleteCompany);

// @route   GET /api/companies/:id/export
// @access  Private (TnP Admin only)
router.get('/:id/export', auth, exportApplicants);

// @route   POST /api/companies/close-expired
// @access  Private (Admin only)
router.post('/close-expired', auth, closeExpiredCompanies);

export default router;