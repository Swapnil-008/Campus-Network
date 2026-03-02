import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCompanies, createCompany, applyToCompany, exportApplicants } from '../services/api';
import CompanyCard from '../components/common/CompanyCard';
import CompanyForm from '../components/common/CompanyForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import SearchBar from '../components/common/SearchBar';  // ADD
import FilterBar from '../components/common/FilterBar';  // ADD
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';

const TnP = () => {
  const { user } = useContext(AuthContext);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ADD THESE STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isTnPAdmin = user?.role === 'tnp_admin' || user?.role === 'college_admin';

  // Status filters (only for admins)
  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: '✅ Active' },
    { value: 'expired', label: '⏰ Expired' }
  ];

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    fetchCompanies();
  }, [debouncedSearchTerm, statusFilter]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all' && isTnPAdmin) params.status = statusFilter;

      const res = await getCompanies(params);
      setCompanies(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, isTnPAdmin]);

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
      toast.success('Application submitted successfully!');
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

      toast.success(`Exported ${applicants.length} applicants successfully!`);
    } catch (err) {
      toast.error('Failed to export applicants');
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
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

      {/* ADD SEARCH & FILTER SECTION */}
      <div className="mb-6 space-y-4">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search companies by name, role, or description..."
        />
        {isTnPAdmin && (
          <FilterBar
            filters={statusFilters}
            activeFilter={statusFilter}
            onFilterChange={handleFilterChange}
          />
        )}
      </div>

      {/* Companies List */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {user?.role === 'student' ? 'Companies for You' : 'All Companies'}
          {searchTerm && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (searching for "{searchTerm}")
            </span>
          )}
        </h2>

        {loading ? (
          <LoadingSpinner message="Loading companies..." />
        ) : companies.length === 0 ? (
          <EmptyState
            icon="💼"
            title={searchTerm ? "No Results Found" : "No Companies Available"}
            description={
              searchTerm
                ? `No companies match "${searchTerm}"`
                : user?.role === 'student'
                  ? "No companies match your profile yet. Check back later!"
                  : isTnPAdmin
                    ? "Get started by posting your first company opportunity"
                    : "No placement opportunities have been posted yet"
            }
            action={
              isTnPAdmin && !showCreateForm && !searchTerm ? (
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