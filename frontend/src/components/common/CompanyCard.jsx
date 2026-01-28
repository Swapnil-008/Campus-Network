import { useState } from 'react';

const CompanyCard = ({ company, userRole, onApply, hasApplied, onExport }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isExpired = new Date(company.deadline) < new Date();
  const daysLeft = Math.ceil((new Date(company.deadline) - new Date()) / (1000 * 60 * 60 * 24));

  const handleApplyClick = () => {
    // Open Google Form in new tab
    if (company.formLink) {
      window.open(company.formLink, '_blank');
      // Show confirmation modal
      setShowConfirmModal(true);
    }
  };

  const handleConfirmApplied = async () => {
    try {
      await onApply(company._id);
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Error confirming application:', err);
    }
  };

  return (
    <>
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
                onClick={handleApplyClick}
                disabled={hasApplied}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  hasApplied
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {hasApplied ? '✓ Applied' : 'Apply Now'}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Application</h3>
            <p className="text-gray-700 mb-6">
              Have you successfully submitted the Google Form for <strong>{company.companyName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmApplied}
                className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition font-medium"
              >
                Yes, I've Submitted
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Not Yet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyCard;