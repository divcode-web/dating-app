"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Shield,
  Flag,
  DollarSign,
  CheckCircle,
  XCircle,
  Ban,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  verifiedUsers: number;
  pendingVerifications: number;
  totalReports: number;
  pendingReports: number;
  todaySignups: number;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: any;
  reported_user: any;
}

interface VerificationRequest {
  id: string;
  full_name: string;
  verification_status: string;
  verification_video_url: string;
  verification_submitted_at: string;
  photos: string[];
}

interface UserProfile {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  location_city: string;
  is_premium: boolean;
  is_verified: boolean;
  created_at: string;
  last_active: string;
  photos: string[];
  blocked_by_admin?: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    premiumUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalReports: 0,
    pendingReports: 0,
    todaySignups: 0,
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: adminData, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        await supabase.auth.signOut();
        toast.error("Database error. Please contact support.");
        router.push("/admin/login");
        return;
      }

      if (!adminData) {
        console.log("User is not in admin_users table:", user.email);
        await supabase.auth.signOut();
        toast.error("Access denied. Admin privileges required.");
        router.push("/admin/login");
        return;
      }

      setAdminUser(adminData);
      await loadDashboardData();
    } catch (error) {
      console.error("Error:", error);
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    await Promise.all([loadStats(), loadReports(), loadVerifications(), loadUsers()]);
  };

  const loadStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      const { count: premiumUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_premium", true);

      const { count: verifiedUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_verified", true);

      const { count: pendingVerifications } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending");

      const { count: totalReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true });

      const { count: pendingReports } = await supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todaySignups } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        verifiedUsers: verifiedUsers || 0,
        pendingVerifications: pendingVerifications || 0,
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0,
        todaySignups: todaySignups || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          reporter:user_profiles!reporter_id(id, full_name),
          reported_user:user_profiles!reported_user_id(id, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  };

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, verification_status, verification_video_url, verification_submitted_at, photos")
        .eq("verification_status", "pending")
        .order("verification_submitted_at", { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error loading verifications:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, date_of_birth, gender, location_city, is_premium, is_verified, created_at, last_active, photos")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Load blocked users
      const { data: blocked } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocked_by_admin", true);

      const blockedSet = new Set(blocked?.map(b => b.blocked_id) || []);
      setBlockedUsers(blockedSet);
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleReportAction = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      toast.success(`Report ${status}`);
      await loadReports();
      await loadStats();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update report");
    }
  };

  const handleVerificationAction = async (userId: string, action: "verified" | "rejected") => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          verification_status: action,
          is_verified: action === "verified",
          verified_at: action === "verified" ? new Date().toISOString() : null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`Verification ${action}`);
      await loadVerifications();
      await loadStats();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update verification");
    }
  };

  const handleBlockUser = async (userId: string, reason: string = "Blocked by admin") => {
    try {
      // Insert admin block record (blocker_id = admin, blocked_id = user)
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: adminUser.id,
          blocked_id: userId,
          blocked_by_admin: true,
          reason,
          admin_id: adminUser.id,
        });

      if (error) throw error;

      toast.success("User blocked successfully");
      await loadUsers();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      if (error.code === '23505') {
        toast.error("User is already blocked");
      } else {
        toast.error("Failed to block user");
      }
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocked_id", userId)
        .eq("blocked_by_admin", true);

      if (error) throw error;

      toast.success("User unblocked successfully");
      await loadUsers();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Admin Dashboard
            </h1>
            <p className="text-gray-300 mt-2">Welcome back, {adminUser?.role || 'Admin'}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-xs text-green-400 mt-1">+{stats.todaySignups} today</p>
              </div>
              <Users className="w-12 h-12 text-blue-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Premium Users</p>
                <p className="text-3xl font-bold text-white">{stats.premiumUsers}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}% conversion
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Verified Users</p>
                <p className="text-3xl font-bold text-white">{stats.verifiedUsers}</p>
                <p className="text-xs text-purple-400 mt-1">{stats.pendingVerifications} pending</p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-400 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Reports</p>
                <p className="text-3xl font-bold text-white">{stats.totalReports}</p>
                <p className="text-xs text-red-400 mt-1">{stats.pendingReports} pending</p>
              </div>
              <Flag className="w-12 h-12 text-red-400 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20">
              Users ({stats.totalUsers})
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white/20">
              Reports ({stats.pendingReports})
            </TabsTrigger>
            <TabsTrigger value="verifications" className="data-[state=active]:bg-white/20">
              Verifications ({stats.pendingVerifications})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">All Users</h2>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No users found</p>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* User Photo */}
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {user.photos && user.photos[0] ? (
                            <img src={user.photos[0]} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-white/50">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{user.full_name}</h3>
                            {user.is_verified && (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                            {user.is_premium && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                Premium
                              </span>
                            )}
                            {blockedUsers.has(user.id) && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                Blocked
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                            <div>
                              <span className="text-gray-400">Gender:</span> {user.gender}
                            </div>
                            <div>
                              <span className="text-gray-400">Age:</span>{" "}
                              {new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()}
                            </div>
                            <div>
                              <span className="text-gray-400">Location:</span> {user.location_city || "Not set"}
                            </div>
                            <div>
                              <span className="text-gray-400">Joined:</span>{" "}
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-gray-400">
                            Last active: {new Date(user.last_active).toLocaleString()}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {blockedUsers.has(user.id) ? (
                            <Button
                              size="sm"
                              onClick={() => handleUnblockUser(user.id)}
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            >
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleBlockUser(user.id)}
                              variant="outline"
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Block
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">User Reports</h2>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No reports found</p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(report.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium text-white">Type: {report.report_type}</p>
                          <p className="text-sm text-gray-300 mt-1">
                            Reporter: {(report.reporter as any)?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-300">
                            Reported: {(report.reported_user as any)?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-200 mt-2 bg-white/5 p-2 rounded">
                            {report.reason}
                          </p>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleReportAction(report.id, 'resolved')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20"
                              onClick={() => handleReportAction(report.id, 'dismissed')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Pending Verifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {verifications.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 col-span-full">
                    No pending verifications
                  </p>
                ) : (
                  verifications.map((v) => (
                    <Card key={v.id} className="p-4 bg-white/5 border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={v.photos?.[0] || "/default-avatar.png"}
                          alt={v.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">{v.full_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(v.verification_submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {v.verification_video_url && (
                        <div className="mb-3">
                          <video
                            src={v.verification_video_url}
                            controls
                            preload="metadata"
                            className="w-full rounded-lg bg-black"
                            style={{ maxHeight: '400px' }}
                          >
                            <source src={v.verification_video_url} type="video/mp4" />
                            <source src={v.verification_video_url} type="video/webm" />
                            <source src={v.verification_video_url} type="video/quicktime" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerificationAction(v.id, "verified")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => handleVerificationAction(v.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
