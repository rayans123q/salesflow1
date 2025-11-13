import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { User } from '../types';

interface AdminStats {
  totalUsers: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  verifiedUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
  totalCampaigns: number;
  campaignsToday: number;
  totalPosts: number;
  postsToday: number;
  totalVisits: number;
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  uniqueVisitorsToday: number;
  estimatedMonthlyRevenue: number;
}

interface UserWithDetails extends User {
  email?: string;
  createdAt: string;
  lastLogin?: string;
  isVerified: boolean;
  totalPosts: number;
  subscriptionStatus: string;
  subscriptionPlan: string;
  campaignCount: number;
}

interface AdminLog {
  id: string;
  adminUserId: string;
  actionType: string;
  targetUserId?: string;
  actionDetails: any;
  createdAt: string;
  adminName?: string;
  targetUserName?: string;
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
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [statsData, usersData, logsData, notificationsData] = await Promise.all([
        databaseService.getAdminStats(),
        databaseService.getAllUsersWithDetails(),
        databaseService.getAdminLogs(),
        databaseService.getAdminNotifications()
      ]);
      
      setStats(statsData);
      setUsers(usersData);
      setAdminLogs(logsData);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (action: string, targetUser: UserWithDetails, details?: any) => {
    try {
      setError(null);
      
      switch (action) {
        case 'verify':
          await databaseService.verifyUser(targetUser.id!);
          await databaseService.logAdminAction(user.id!, 'user_verified', targetUser.id!, { userEmail: targetUser.email });
          setSuccessMessage(`User ${targetUser.name} has been verified.`);
          break;
