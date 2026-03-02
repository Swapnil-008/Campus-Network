import { useState } from 'react';
import {
    approveJoinRequest,
    removeMember,
    makeAdmin,
    removeAdmin,
    leaveGroup,
    updateGroupSettings,
    deleteGroup
} from '../../services/api';
import toast from 'react-hot-toast';

// Robust ID comparison
const getId = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    return obj._id || obj.id || String(obj);
};
const idsMatch = (a, b) => {
    const idA = getId(a);
    const idB = getId(b);
    return idA && idB && idA.toString() === idB.toString();
};

const GroupInfoPanel = ({ group, currentUser, onClose, onGroupUpdated }) => {
    const [activeTab, setActiveTab] = useState('members');
    const [loading, setLoading] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [settings, setSettings] = useState({
        name: group.name,
        description: group.description || '',
        onlyAdminsCanPost: group.settings?.onlyAdminsCanPost || false,
        requireApproval: group.settings?.requireApproval || false
    });

    const currentUserId = currentUser._id || currentUser.id;
    const isAdmin = group.admins?.some(a => idsMatch(a, currentUserId));
    const isCreator = idsMatch(group.createdBy, currentUserId);
    const pendingRequests = group.pendingRequests || [];

    const handleApprove = async (userId) => {
        setLoading(`approve-${userId}`);
        try {
            await approveJoinRequest(group._id, userId);
            toast.success('User approved!');
            onGroupUpdated();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to approve');
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async (userId) => {
        setLoading(`reject-${userId}`);
        try {
            await removeMember(group._id, userId);
            toast.success('Request rejected');
            onGroupUpdated();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reject');
        } finally {
            setLoading(null);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Remove this member from the group?')) return;
        setLoading(`remove-${userId}`);
        try {
            await removeMember(group._id, userId);
            toast.success('Member removed');
            onGroupUpdated();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove member');
        } finally {
            setLoading(null);
        }
    };

    const handleMakeAdmin = async (userId) => {
        setLoading(`admin-${userId}`);
        try {
            await makeAdmin(group._id, userId);
            toast.success('Admin rights granted!');
            onGroupUpdated();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to make admin');
        } finally {
            setLoading(null);
        }
    };

    const handleRemoveAdmin = async (userId) => {
        setLoading(`deadmin-${userId}`);
        try {
            await removeAdmin(group._id, userId);
            toast.success('Admin rights removed');
            onGroupUpdated();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove admin');
        } finally {
            setLoading(null);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;
        setLoading('leave');
        try {
            await leaveGroup(group._id);
            toast.success('Left group');
            onGroupUpdated();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to leave group');
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this group permanently? This cannot be undone.')) return;
        setLoading('delete');
        try {
            await deleteGroup(group._id);
            toast.success('Group deleted');
            onGroupUpdated();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete group');
        } finally {
            setLoading(null);
        }
    };

    const handleSaveSettings = async () => {
        setLoading('settings');
        try {
            await updateGroupSettings(group._id, {
                name: settings.name,
                description: settings.description,
                settings: {
                    onlyAdminsCanPost: settings.onlyAdminsCanPost,
                    requireApproval: settings.requireApproval
                }
            });
            toast.success('Settings updated!');
            setEditMode(false);
            onGroupUpdated();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setLoading(null);
        }
    };

    const getMemberRole = (member) => {
        const id = getId(member);
        if (idsMatch(group.createdBy, id)) return 'creator';
        if (group.admins?.some(a => idsMatch(a, id))) return 'admin';
        return 'member';
    };

    const members = group.members || [];

    // Count tabs to show
    const hasPending = isAdmin && pendingRequests.length > 0;

    return (
        <div className="w-80 border-l bg-white flex flex-col shrink-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg">Group Info</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Group Name & Description */}
            <div className="p-4 border-b shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xl">
                        👥
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold">{group.name}</h4>
                        <p className="text-xs text-gray-500">{group.type} • {members.length} members</p>
                    </div>
                </div>
                {group.description && (
                    <p className="text-sm text-gray-600 mt-2">{group.description}</p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                    {group.settings?.onlyAdminsCanPost && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">🔒 Admin only</span>
                    )}
                    {group.settings?.requireApproval && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">✋ Approval required</span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b shrink-0">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`flex-1 py-2 text-sm font-medium transition ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Members
                </button>
                {hasPending && (
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2 text-sm font-medium transition ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pending
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                            {pendingRequests.length}
                        </span>
                    </button>
                )}
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex-1 py-2 text-sm font-medium transition ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Settings
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="divide-y">
                        {members.map((member) => {
                            const memberId = getId(member);
                            const role = getMemberRole(member);
                            const isSelf = idsMatch(memberId, currentUserId);

                            return (
                                <div key={memberId} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                                    <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {member.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {member.name || 'Unknown'} {isSelf && '(You)'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            {role === 'creator' && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Creator</span>
                                            )}
                                            {role === 'admin' && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Admin</span>
                                            )}
                                            {member.department && (
                                                <span className="text-xs text-gray-400">{member.department}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin/Creator actions on other members */}
                                    {(isAdmin || isCreator) && !isSelf && role !== 'creator' && (
                                        <div className="flex gap-1 shrink-0">
                                            {/* Make Admin — admins can promote regular members */}
                                            {role === 'member' && (
                                                <button
                                                    onClick={() => handleMakeAdmin(memberId)}
                                                    disabled={loading === `admin-${memberId}`}
                                                    className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition disabled:opacity-50"
                                                    title="Make Admin"
                                                >
                                                    ⬆️
                                                </button>
                                            )}
                                            {/* Remove Admin — only creator can demote admins */}
                                            {role === 'admin' && isCreator && (
                                                <button
                                                    onClick={() => handleRemoveAdmin(memberId)}
                                                    disabled={loading === `deadmin-${memberId}`}
                                                    className="text-xs text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition disabled:opacity-50"
                                                    title="Remove Admin"
                                                >
                                                    ⬇️
                                                </button>
                                            )}
                                            {/* Kick — admins can kick members, creator can kick anyone except other admins (handled by backend) */}
                                            <button
                                                onClick={() => handleRemoveMember(memberId)}
                                                disabled={loading === `remove-${memberId}`}
                                                className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition disabled:opacity-50"
                                                title="Remove from group"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pending Requests Tab */}
                {activeTab === 'pending' && (
                    <div>
                        {pendingRequests.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                No pending requests
                            </div>
                        ) : (
                            <div className="divide-y">
                                {pendingRequests.map((reqUser) => {
                                    const userId = getId(reqUser);
                                    return (
                                        <div key={userId} className="p-3 flex items-center gap-3">
                                            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                {reqUser.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{reqUser.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">{reqUser.department} • {reqUser.role}</p>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleApprove(userId)}
                                                    disabled={loading === `approve-${userId}`}
                                                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition disabled:opacity-50 font-medium"
                                                >
                                                    {loading === `approve-${userId}` ? '...' : 'Accept'}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(userId)}
                                                    disabled={loading === `reject-${userId}`}
                                                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition disabled:opacity-50 font-medium"
                                                >
                                                    {loading === `reject-${userId}` ? '...' : 'Decline'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && isAdmin && (
                    <div className="p-4 space-y-4">
                        {editMode ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                    <input
                                        type="text"
                                        value={settings.name}
                                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={settings.description}
                                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        rows="3"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.onlyAdminsCanPost}
                                            onChange={(e) => setSettings({ ...settings, onlyAdminsCanPost: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm">Only admins can post</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings.requireApproval}
                                            onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm">Require approval to join</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={loading === 'settings'}
                                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm disabled:opacity-50"
                                    >
                                        {loading === 'settings' ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">Admin only posting</span>
                                        <span className={`text-sm font-medium ${group.settings?.onlyAdminsCanPost ? 'text-green-600' : 'text-gray-400'}`}>
                                            {group.settings?.onlyAdminsCanPost ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">Require approval</span>
                                        <span className={`text-sm font-medium ${group.settings?.requireApproval ? 'text-green-600' : 'text-gray-400'}`}>
                                            {group.settings?.requireApproval ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm"
                                >
                                    Edit Settings
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Actions — ALWAYS visible to all members, outside settings tab */}
            <div className="p-4 border-t space-y-2 shrink-0">
                <button
                    onClick={handleLeave}
                    disabled={loading === 'leave'}
                    className="w-full text-orange-600 border border-orange-300 py-2 rounded-md hover:bg-orange-50 transition text-sm disabled:opacity-50 font-medium"
                >
                    {loading === 'leave' ? 'Leaving...' : '🚪 Leave Group'}
                </button>
                {isCreator && (
                    <button
                        onClick={handleDelete}
                        disabled={loading === 'delete'}
                        className="w-full text-red-600 border border-red-300 py-2 rounded-md hover:bg-red-50 transition text-sm disabled:opacity-50 font-medium"
                    >
                        {loading === 'delete' ? 'Deleting...' : '🗑️ Delete Group'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default GroupInfoPanel;
