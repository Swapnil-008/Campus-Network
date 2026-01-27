import { useState } from 'react';

const CompanyForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    description: '',
    packageMin: '',
    packageMax: '',
    branches: [],
    minCGPA: '',
    years: [],
    deadline: '',
    formLink: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    companyName,
    role,
    description,
    packageMin,
    packageMax,
    branches,
    minCGPA,
    years,
    deadline,
    formLink
  } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBranchChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      branches: formData.branches.includes(value)
        ? formData.branches.filter(b => b !== value)
        : [...formData.branches, value]
    });
  };

  const handleYearChange = (e) => {
    const value = parseInt(e.target.value);
    setFormData({
      ...formData,
      years: formData.years.includes(value)
        ? formData.years.filter(y => y !== value)
        : [...formData.years, value]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (branches.length === 0) {
      setError('Please select at least one branch');
      return;
    }

    if (years.length === 0) {
      setError('Please select at least one year');
      return;
    }

    setLoading(true);

    const companyData = {
      companyName,
      role,
      description,
      packageOffered: packageMin && packageMax ? {
        min: parseFloat(packageMin),
        max: parseFloat(packageMax)
      } : undefined,
      eligibility: {
        branches,
        minCGPA: parseFloat(minCGPA),
        years
      },
      deadline,
      formLink: formLink || null
    };

    try {
      await onSubmit(companyData);
      // Reset form
      setFormData({
        companyName: '',
        role: '',
        description: '',
        packageMin: '',
        packageMax: '',
        branches: [],
        minCGPA: '',
        years: [],
        deadline: '',
        formLink: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Post New Company</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={companyName}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Google"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <input
              type="text"
              name="role"
              value={role}
              onChange={onChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Software Engineer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            required
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Job description, requirements, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package (Min in LPA)
            </label>
            <input
              type="number"
              name="packageMin"
              value={packageMin}
              onChange={onChange}
              step="0.1"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package (Max in LPA)
            </label>
            <input
              type="number"
              name="packageMax"
              value={packageMax}
              onChange={onChange}
              step="0.1"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 12"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eligible Branches *
          </label>
          <div className="space-y-2">
            {['CS', 'IT', 'EnTC'].map((branch) => (
              <label key={branch} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={branch}
                  checked={branches.includes(branch)}
                  onChange={handleBranchChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{branch}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum CGPA *
          </label>
          <input
            type="number"
            name="minCGPA"
            value={minCGPA}
            onChange={onChange}
            required
            step="0.01"
            min="0"
            max="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 7.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eligible Years *
          </label>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((year) => (
              <label key={year} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={year}
                  checked={years.includes(year)}
                  onChange={handleYearChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Year {year}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application Deadline *
          </label>
          <input
            type="datetime-local"
            name="deadline"
            value={deadline}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application Form Link (Optional)
          </label>
          <input
            type="url"
            name="formLink"
            value={formLink}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://forms.google.com/..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Posting...' : 'Post Company'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;