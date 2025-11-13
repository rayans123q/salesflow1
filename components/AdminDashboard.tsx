import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { databaseService as db } from '../services/databaseService';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalVisitors: number;
  visitorsToday: number;
  newUsersToday: number;
  totalPosts: number;
}

interface UserWithDetails extends User {
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  totalPosts?: number;
  lastLogin?: string;
  isVerified: boolean;
}

interface AdminLog {
  id: string;
  action: string;
  details: string;
  metadata?: any;
  createdAt: string;
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs' | 'notifications'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsData, usersData, logsData, notificationsData] = await Promise.all([
        db.getAdminStats(),
        db.getAllUsersWithDetails(),
        db.getAdminLogs(50),
        db.getAdminNotifications(20)
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setLogs(logsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    if (!confirm('Are you sure you want to verify this user?')) return;
    
    try {
      await db.verifyUser(userId);
      await db.logAdminAction(user.id, 'verify_user', `Verified user ${userId}`);
      await loadAdminData();
    } catch (error) {
      console.error('Failed to verify user:', error);
      alert('Failed to verify user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await db.deleteUser(userId);
      await db.logAdminAction(user.id, 'delete_user', `Deleted user ${userId}`);
      await loadAdminData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (user: UserWithDetails) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      await db.updateUserSubscriptionAdmin(
        editingUser.id,
        editingUser.subscriptionPlan || 'free',
        editingUser.subscriptionStatus || 'inactive'
      );
      await db.logAdminAction(user.id, 'update_subscription', `Updated subscription for user ${editingUser.id}`);
      setShowEditModal(false);
      setEditingUser(null);
      await loadAdminData();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await db.markNotificationAsRead(notificationId);
      await loadAdminData();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const exportUsersToCSV = () => {
    const csv = [
      ['Name', 'Email', 'Subscription', 'Status', 'Posts', 'Verified', 'Created'],
      ...filteredUsers.map(u => [
        u.name,
        u.email || '',
        u.subscriptionPlan || 'free',
        u.subscriptionStatus || 'inactive',
        u.totalPosts || 0,
        u.isVerified ? 'Yes' : 'No',
        new Date(u.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogsToCSV = () => {
    const csv = [
      ['Action', 'Details', 'Date'],
      ...logs.map(l => [
        l.action,
        l.details,
        new Date(l.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = (() => {
      switch (filterStatus) {
        case 'active': return user.subscriptionStatus === 'active';
        case 'inactive': return user.subscriptionStatus !== 'active';
        case 'verified': return user.isVerified;
        case 'unverified': return !user.isVerified;
        default: return true;
      }
    })();
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🛡️ Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage users, analytics, and system settings</p>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg">
            Logout
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {(['overview', 'users', 'logs', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
              }`}
            >
              {tab}
              {tab === 'notifications' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl">
              <p className="text-white/80 text-sm">Total Users</p>
              <p className="text-white text-3xl font-bold mt-1">{stats.totalUsers || 0}</p>
              <p className="text-white/70 text-xs mt-1">+{stats.newUsersToday || 0} today</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl">
              <p className="text-white/80 text-sm">Active Subscriptions</p>
              <p className="text-white text-3xl font-bold mt-1">{stats.activeSubscriptions || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl">
              <p className="text-white/80 text-sm">Total Visitors</p>
              <p className="text-white text-3xl font-bold mt-1">{stats.totalVisitors || 0}</p>
              <p className="text-white/70 text-xs mt-1">{stats.visitorsToday || 0} today</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl">
              <p className="text-white/80 text-sm">Total Posts</p>
              <p className="text-white text-3xl font-bold mt-1">{stats.totalPosts || 0}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
                <button onClick={exportUsersToCSV} className="px-6 py-2 bg-blue-600 rounded-lg">
                  Export CSV
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Subscription</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          u.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600'
                        }`}>
                          {u.subscriptionPlan || 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isVerified ? <span className="text-green-400">✓ Verified</span> : <span className="text-yellow-400">⚠ Unverified</span>}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button onClick={() => handleEditUser(u)} className="px-3 py-1 bg-blue-600 rounded">Edit</button>
                        {!u.isVerified && <button onClick={() => handleVerifyUser(u.id)} className="px-3 py-1 bg-green-600 rounded">Verify</button>}
                        <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 bg-red-600 rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">Activity Logs</h2>
              <button onClick={exportLogsToCSV} className="px-6 py-2 bg-blue-600 rounded-lg">Export</button>
            </div>
            <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
              {logs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">{log.action}</span>
                    <span className="text-gray-400 text-sm">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-gray-300">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 ${!n.isRead ? 'bg-blue-500/5' : ''}`}>
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{n.title}</h3>
                      <p className="text-gray-400 text-sm">{n.message}</p>
                      <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => handleMarkAsRead(n.id)} className="px-3 py-1 bg-blue-600 rounded text-sm">
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit User: {editingUser.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Subscription Plan</label>
                <select
                  value={editingUser.subscriptionPlan || 'free'}
                  onChange={(e) => setEditingUser({ ...editingUser, subscriptionPlan: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Status</label>
                <select
                  value={editingUser.subscriptionStatus || 'inactive'}
                  onChange={(e) => setEditingUser({ ...editingUser, subscriptionStatus: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={handleSaveUser} className="flex-1 px-4 py-2 bg-blue-600 rounded-lg">Save</button>
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 bg-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
