import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCompanies, createCompany, applyToCompany, exportApplicants } from '../services/api';
import CompanyCard from '../components/common/CompanyCard';
import CompanyForm from '../components/common/CompanyForm';

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
      fetchCompanies(); // Refresh to update application status
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply');
    }
  };

  const handleExport = async (companyId) => {
    try {
      const res = await exportApplicants(companyId);
      const applicants = res.data;

      // Convert to CSV
      const headers = ['Name', 'Email', 'Department', 'Year', 'CGPA', 'Applied At'];
      const csvContent = [
        headers.join(','),
        ...applicants.map(app =>
          [
            app.name,
            app.email,
            app.department,
            app.year,
            app.cgpa,
            new Date(app.appliedAt).toLocaleString()
          ].join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applicants-${companyId}.csv`;
      a.click();
    } catch (err) {
      alert('Failed to export applicants');
    }
  };

  const hasApplied = (companyId) => {
    const company = companies.find(c => c._id === companyId);
    return company?.applications?.some(app => app.student._id === user?.id) || false;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium"
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
        <h2 className="text-2xl font-bold mb-4">
          {user?.role === 'student' ? 'Companies for You' : 'All Companies'}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading companies...</div>
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No companies posted yet</p>
          </div>
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