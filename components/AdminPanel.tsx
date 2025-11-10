import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';

interface UserData {
  id: string;
  name: string;
  email?: string;
  role?: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    subscribed: boolean;
    startedAt?: string;
    expiresAt?: string;
  };
  campaignCount: number;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<string>('free');
  const [newStatus, setNewStatus] = useState<string>('inactive');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = await databaseService.getAllUsers();
      
      // Fetch detailed subscription info for each user
      const usersWithDetails = await Promise.all(
        allUsers.map(u => databaseService.getUserWithSubscription(u.id!))
      );
      
      setUsers(usersWithDetails);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      const userDetails = await databaseService.getUserWithSubscription(userId);
      setSelectedUser(userDetails);
      setNewPlan(userDetails.subscription.plan || 'free');
      setNewStatus(userDetails.subscription.status || 'inactive');
      setError(null);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError('Failed to load user details.');
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      setError(null);
      await databaseService.updateUserSubscription(selectedUser.id, newPlan, newStatus);
      
      setSuccessMessage(`Successfully updated ${selectedUser.name}'s subscription to ${newPlan} (${newStatus})`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload user data
      await loadUsers();
      const updated = await databaseService.getUserWithSubscription(selectedUser.id);
      setSelectedUser(updated);
    } catch (err) {
      console.error('Failed to update subscription:', err);
      setError('Failed to update subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      setError(null);
      await databaseService.updateUserRole(userId, role);
      setSuccessMessage(`Successfully updated user role to ${role}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update role. Please try again.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Admin Panel</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1 bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-color)]">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Users ({users.length})</h2>
          
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 mb-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          />

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-[var(--text-secondary)]">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-[var(--text-secondary)]">No users found</div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{user.email || 'No email'}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Plan: <span className="font-semibold text-blue-400">{user.subscription.plan}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Details & Subscription Management */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-color)]">
          {selectedUser ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">{selectedUser.name}</h2>

              {/* User Info */}
              <div className="mb-6 p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">User Information</h3>
                <div className="space-y-2 text-[var(--text-secondary)]">
                  <div><strong>Email:</strong> {selectedUser.email || 'N/A'}</div>
                  <div><strong>User ID:</strong> <code className="text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded">{selectedUser.id}</code></div>
                  <div><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                  <div><strong>Campaigns:</strong> {selectedUser.campaignCount}</div>
                  <div className="pt-2">
                    <strong>Role:</strong>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleUpdateRole(selectedUser.id, 'user')}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          selectedUser.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                        }`}
                      >
                        User
                      </button>
                      <button
                        onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          selectedUser.role === 'admin'
                            ? 'bg-purple-500 text-white'
                            : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Management */}
              <div className="p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Subscription Management</h3>

                <div className="space-y-4">
                  {/* Current Subscription */}
                  <div className="p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]">
                    <div className="text-sm text-[var(--text-secondary)] mb-2">Current Subscription</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {selectedUser.subscription.plan.charAt(0).toUpperCase() + selectedUser.subscription.plan.slice(1)}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          Status: <span className={`font-semibold ${
                            selectedUser.subscription.status === 'active' ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {selectedUser.subscription.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Change Plan
                    </label>
                    <select
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Subscription Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleUpdateSubscription}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
                  >
                    {isLoading ? 'Updating...' : 'Update Subscription'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
              Select a user to view and manage their subscription
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
