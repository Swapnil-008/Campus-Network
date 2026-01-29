import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCompanies, createCompany, applyToCompany, exportApplicants } from '../services/api';
import CompanyCard from '../components/common/CompanyCard';
import CompanyForm from '../components/common/CompanyForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const TnP = () => {
  const { user } = useContext(AuthContext);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isTnPAdmin = user?.role === 'tnp_admin' || user?.role === 'college_admin';

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await getCompanies();
      setCompanies(res.data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (companyData) => {
    try {
      await createCompany(companyData);
      setShowCreateForm(false);
      fetchCompanies();
    } catch (err) {
      throw err;
    }
  };

  const handleApply = async (companyId) => {
    try {
      await applyToCompany(companyId);
      fetchCompanies();
      toast.success('✅ Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
      throw err;
    }
  };

  const handleExport = async (companyId) => {
    try {
      const res = await exportApplicants(companyId);
      const applicants = res.data;

      if (applicants.length === 0) {
        toast.info('No applicants yet for this company');
        return;
      }

      // Convert to CSV
      const headers = ['Name', 'Email', 'Department', 'Year', 'CGPA', 'Applied At'];
      const csvContent = [
        headers.join(','),
        ...applicants.map(app =>
          [
            `"${app.name}"`,
            app.email,
            app.department,
            app.year,
            app.cgpa,
            new Date(app.appliedAt).toLocaleString()
          ].join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicants-${companyId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`✅ Exported ${applicants.length} applicants successfully!`);
    } catch (err) {
      toast.error('Failed to export applicants');
    }
  };

  const hasApplied = (companyId) => {
    const company = companies.find(c => c._id === companyId);
    if (!company || !company.applications) return false;
    
    const userIdStr = user?.id?.toString();
    
    return company.applications.some(app => {
      const appStudentId = app.student?._id?.toString() || app.student?.toString();
      return appStudentId === userIdStr;
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Training & Placement</h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'student'
            ? 'Browse and apply to companies that match your profile'
            : 'Manage placement opportunities for students'}
        </p>
      </div>

      {/* Create Company Button (TnP Admin only) */}
      {isTnPAdmin && (
        <div className="mb-6">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
            >
              + Post New Company
            </button>
          ) : (
            <CompanyForm
              onSubmit={handleCreateCompany}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </div>
      )}

      {/* Companies List */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {user?.role === 'student' ? 'Companies for You' : 'All Companies'}
        </h2>

        {loading ? (
          <LoadingSpinner message="Loading companies..." />
        ) : companies.length === 0 ? (
          <EmptyState
            icon="💼"
            title="No Companies Available"
            description={
              user?.role === 'student'
                ? "No companies match your profile yet. Check back later!"
                : isTnPAdmin
                ? "Get started by posting your first company opportunity"
                : "No placement opportunities have been posted yet"
            }
            action={
              isTnPAdmin && !showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Post First Company
                </button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-4">
            {companies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                userRole={user?.role}
                onApply={handleApply}
                hasApplied={hasApplied(company._id)}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TnP;