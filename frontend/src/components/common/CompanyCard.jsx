import { useState } from 'react';

const CompanyCard = ({ company, userRole, onApply, hasApplied, onExport }) => {
  const [applying, setApplying] = useState(false);

  const isExpired = new Date(company.deadline) < new Date();
  const daysLeft = Math.ceil((new Date(company.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(company._id);
    } catch (err) {
      console.error('Error applying:', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${isExpired ? 'border-gray-400' : 'border-green-400'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{company.companyName}</h3>
          <p className="text-lg text-gray-600 mt-1">{company.role}</p>
        </div>
        <div className="text-right">
          {company.packageOffered && (
            <p className="text-sm font-semibold text-green-600">
              ₹{company.packageOffered.min}L - ₹{company.packageOffered.max}L
            </p>
          )}
          {isExpired ? (
            <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
              CLOSED
            </span>
          ) : (
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              OPEN
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{company.description}</p>

      {/* Eligibility */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm font-semibold text-blue-900 mb-2">Eligibility:</p>
        <div className="text-sm text-blue-800 space-y-1">
          <p>🎓 <strong>Branches:</strong> {company.eligibility.branches.join(', ')}</p>
          <p>📊 <strong>Min CGPA:</strong> {company.eligibility.minCGPA}</p>
          <p>📅 <strong>Years:</strong> {company.eligibility.years.join(', ')}</p>
        </div>
      </div>

      {/* Deadline */}
      <div className={`mb-4 p-3 rounded border ${isExpired ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200'}`}>
        <p className="text-sm">
          <span className={isExpired ? 'text-gray-700' : 'text-orange-800'}>
            ⏰ <strong>Deadline:</strong> {new Date(company.deadline).toLocaleString()}
            {!isExpired && daysLeft >= 0 && (
              <span className="ml-2 font-semibold">
                ({daysLeft} {daysLeft === 1 ? 'day' : 'days'} left)
              </span>
            )}
          </span>
        </p>
      </div>

      {/* Form Link */}
      {company.formLink && (
        <div className="mb-4">
          <a  // <--- Added missing opening tag here
            href={company.formLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          >
            🔗 Application Form Link
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-xs text-gray-500">
          <p>Posted: {new Date(company.createdAt).toLocaleString()}</p>
          {userRole === 'tnp_admin' || userRole === 'college_admin' ? (
            <p className="mt-1">Applications: <strong>{company.applications?.length || 0}</strong></p>
          ) : null}
        </div>

        <div className="flex gap-2">
          {/* Student Apply Button */}
          {userRole === 'student' && !isExpired && (
            <button
              onClick={handleApply}
              disabled={hasApplied || applying}
              className={`px-4 py-2 rounded-md font-medium transition ${
                hasApplied
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {hasApplied ? '✓ Applied' : applying ? 'Applying...' : 'Apply Now'}
            </button>
          )}

          {/* TnP Admin Export Button */}
          {(userRole === 'tnp_admin' || userRole === 'college_admin') && (
            <button
              onClick={() => onExport(company._id)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
            >
              📥 Export Applicants
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;