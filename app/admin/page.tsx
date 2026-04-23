"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GraduationCap, Loader2, Calendar as CalendarIcon, Check, X, Search, Filter, BarChart3, Clock, Users, CheckCircle, Eye, FileText, CalendarDays, MapPin, AlertCircle, ChevronDown, ChevronUp, MoreHorizontal, Shield, BookOpen, Award, LogOut, User } from "lucide-react";
import { getAppointments, updateAppointment, getDashboardStats, getAvailableSlots } from "@/lib/api";
import { toast } from "sonner";
import { createClient } from '@/utils/supabase/client';

const acadYears = ["All", "2024-2025", "2025-2026"];
const researchTypes = ["All", "CAPSTONE", "THESIS"];
const defenseTypes = ["All", "PROPOSAL", "FINAL"];
const statuses = ["All", "PENDING", "APPROVED", "NOT APPROVED", "COMPLETED"];

function AdminNavigation({ user, onSignOut, activeTab, setActiveTab, stats }: { 
  user: any; 
  onSignOut: () => void;
  activeTab: 'dashboard' | 'list' | 'users';
  setActiveTab: (tab: 'dashboard' | 'list' | 'users') => void;
  stats: Stats | null;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Dashboard</span>
          </Link>

          {/* Admin Navigation Links */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'dashboard' 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              dashboard
            </div>
            <div
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'list' 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              defense list
              {stats && stats.pending > 0 && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {stats.pending}
                </span>
              )}
            </div>
            <div
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                activeTab === 'users' 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" />
              users
            </div>
            <Button
              variant="outline"
              onClick={onSignOut}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface Appointment {
  id: string;
  tracking_number: string;
  appointment_code: string;
  research_title: string;
  group_code: string;
  student_name: string;
  student_email: string;
  date: string;
  time_desc: string;
  room: string;
  status: string;
  research_type: string;
  defense_type: string;
  adviser_name: string;
  acad_year: string;
  created_at: string;
  updated_at: string;
  students?: Array<{
    student_id: string;
    name: string;
    email: string;
    role: string;
    course_section: string;
  }>;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedView, setSelectedView] = useState<'all' | 'pending' | 'approved' | 'not-approved' | 'completed'>('pending');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'users'>('dashboard');
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "PENDING",
    acadYear: "All",
    researchType: "All",
    defenseType: "All",
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleRoom, setRescheduleRoom] = useState("");
  const [availableSlots, setAvailableSlots] = useState<{ hour: number; time: string; endTime?: string; code?: string; display?: string }[]>([]);
  const [panelists, setPanelists] = useState<{ chairman: string; member1: string; member2: string }>({
    chairman: "",
    member1: "",
    member2: ""
  });
  const [appointmentsPanelists, setAppointmentsPanelists] = useState<Record<string, any[]>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [panelUsers, setPanelUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isNotApproveConfirmOpen, setIsNotApproveConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [appointmentToNotApprove, setAppointmentToNotApprove] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ username: '', fullname: '', role: 'PANEL', password: '' });
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    approved: true,
    completed: false,
    notApproved: false,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    } else if (!authLoading && user?.user_metadata?.role === "PANEL") {
      router.push("/panel");
    } else if (!authLoading && user?.user_metadata?.role !== "ADMIN" && user?.user_metadata?.role !== "SUPERADMIN") {
      router.push("/student");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    // Handle hash navigation for views
    const hash = window.location.hash;
    if (hash === "#list") {
      setActiveTab("list");
      setFilters({...filters, status: 'PENDING'});
    } else {
      setActiveTab("dashboard");
    }
  }, []);

  useEffect(() => {
    if (user?.user_metadata?.role === "ADMIN") {
      fetchData();
    }
  }, [user, filters]);

  // Set up real-time subscription for appointments
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('admin-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Admin real-time change received:', payload);
          if (user?.user_metadata?.role === "ADMIN") {
            fetchData();
            getDashboardStats("");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === 'users' && user?.user_metadata?.role === "ADMIN") {
      fetchUsers();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (rescheduleDate && rescheduleRoom && user) {
      fetchAvailableSlots(rescheduleDate, rescheduleRoom);
    }
  }, [rescheduleDate, rescheduleRoom, user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.acadYear !== "All") params.acadYear = filters.acadYear;
      if (filters.researchType !== "All") params.researchType = filters.researchType;
      if (filters.defenseType !== "All") params.defenseType = filters.defenseType;
      if (filters.status !== "All") params.status = filters.status;

      const [appointmentsData, statsData] = await Promise.all([
        getAppointments("", params),
        getDashboardStats(""),
      ]);

      setAppointments(appointmentsData);
      setStats(statsData);

      // Fetch panelists for each approved appointment
      const panelistsPromises = appointmentsData
        .filter((apt: Appointment) => apt.status === 'APPROVED' && apt.group_code)
        .map(async (apt: Appointment) => {
          try {
            const response = await fetch(`/api/panelists?group_code=${apt.group_code}`);
            if (response.ok) {
              const data = await response.json();
              return { groupCode: apt.group_code, panelists: data };
            }
            return { groupCode: apt.group_code, panelists: [] };
          } catch {
            return { groupCode: apt.group_code, panelists: [] };
          }
        });

      const panelistsResults = await Promise.all(panelistsPromises);
      const panelistsMap: Record<string, any[]> = {};
      panelistsResults.forEach(result => {
        panelistsMap[result.groupCode] = result.panelists;
      });
      setAppointmentsPanelists(panelistsMap);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: Date, room: string) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const data = await getAvailableSlots("", dateStr, room);
      setAvailableSlots(data);
    } catch (error) {
      setAvailableSlots([]);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateAppointment("", id, { status });
      toast.success(`Appointment ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const handleApproveWithPanelists = async (appointmentId: string) => {
    try {
      // Get the appointment to get the group_code
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Insert panelists into panelist table using group_code
      const panelistsData = [
        {
          group_code: appointment.group_code,
          name: panelists.chairman,
          role: "CHAIRMAN"
        },
        {
          group_code: appointment.group_code,
          name: panelists.member1,
          role: "MEMBER"
        },
        {
          group_code: appointment.group_code,
          name: panelists.member2,
          role: "MEMBER"
        }
      ];

      // Call panelists API to insert panelists
      const panelistsResponse = await fetch('/api/panelists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ panelists: panelistsData }),
      });

      console.log('Panelists API Response Status:', panelistsResponse.status);
      
      if (!panelistsResponse.ok) {
        const errorText = await panelistsResponse.text();
        console.error('Panelists API Error Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.details || errorText || 'Failed to assign panelists');
      }

      // Update appointment status to APPROVED after panelists are assigned
      await updateAppointment("", appointmentId, { status: "APPROVED" });

      toast.success("Appointment approved and panelists assigned");
      setSelectedAppointment(null);
      setPanelists({ chairman: "", member1: "", member2: "" });
      setRescheduleDate(undefined);
      setRescheduleTime("");
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to approve appointment";
      toast.error(message);
      console.error('Panelist assignment error:', error);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime || !rescheduleRoom) return;

    try {
      const dateTime = new Date(rescheduleDate);
      const [hours] = rescheduleTime.split(":");
      dateTime.setHours(parseInt(hours), 0, 0, 0);

      await updateAppointment("", selectedAppointment.id, {
        status: "APPROVED",
        dateTime: dateTime.toISOString(),
        room: rescheduleRoom,
      });
      toast.success("Appointment rescheduled successfully");
      setSelectedAppointment(null);
      setRescheduleDate(undefined);
      setRescheduleTime("");
      setRescheduleRoom("");
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reschedule";
      toast.error(message);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        // Filter panel users
        const panelUsers = data.filter((user: any) => user.role === 'PANEL');
        setPanelUsers(panelUsers);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch users:', response.status, errorData);
        setUsers([]);
        setPanelUsers([]);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setUsers([]);
      setPanelUsers([]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toast.success('User added successfully');
        setNewUser({ username: '', fullname: '', role: 'PANEL', password: '' });
        setIsAddUserDialogOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add user');
      }
    } catch (error) {
      toast.error('Failed to add user');
    }
  };

  const handleEditUser = async () => {
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedUser),
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setSelectedUser(null);
        setIsEditUserDialogOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Appointment deleted successfully');
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete appointment');
      }
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = 
      apt.research_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.students?.[0]?.student_id?.toLowerCase() || ''.includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (filters.status === "All" || apt.status === filters.status) &&
      (filters.acadYear === "All" || apt.acad_year === filters.acadYear) &&
      (filters.researchType === "All" || apt.research_type === filters.researchType) &&
      (filters.defenseType === "All" || apt.defense_type === filters.defenseType);
    
    return matchesSearch && matchesFilters;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
      case "NOT APPROVED": return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNavigation 
        user={user} 
        onSignOut={() => router.push("/auth/login")} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Defense Administration Dashboard</h1>
            <p className="text-gray-600">Monitor defense schedules and manage approvals</p>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Enhanced Stats Cards with Quick Actions */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card 
                  className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedView === 'all' ? 'ring-2 ring-orange-500' : ''}`}
                  onClick={() => { setSelectedView('all'); setFilters({...filters, status: 'All'}); setActiveTab('list'); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Defenses</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-800">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            
            <Card 
              className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedView === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
              onClick={() => { setSelectedView('pending'); setFilters({...filters, status: 'PENDING'}); setActiveTab('list'); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                    {stats.pending > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">Needs approval</p>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedView === 'approved' ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => { setSelectedView('approved'); setFilters({...filters, status: 'APPROVED'}); setActiveTab('list'); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                    <p className="text-xs text-green-600 mt-1">Scheduled</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100 text-green-800">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedView === 'not-approved' ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => { setSelectedView('not-approved'); setFilters({...filters, status: 'NOT APPROVED'}); setActiveTab('list'); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Not Approved</p>
                    <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-100 text-red-800">
                    <X className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className={`border-gray-200 cursor-pointer transition-all hover:shadow-md ${selectedView === 'completed' ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => { setSelectedView('completed'); setFilters({...filters, status: 'COMPLETED'}); setActiveTab('list'); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.completed}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            )}

            {/* Upcoming Defenses Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Upcoming Defenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointments
                      .filter(apt => apt.status === 'APPROVED')
                      .slice(0, 5)
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{appointment.research_title}</p>
                            <p className="text-xs text-gray-500">{appointment.students?.[0]?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">{format(new Date(appointment.date), "MMM dd")}</p>
                            <p className="text-xs text-gray-500">{appointment.time_desc}</p>
                          </div>
                        </div>
                      ))}
                    {appointments.filter(apt => apt.status === 'APPROVED').length === 0 && (
                      <p className="text-center text-gray-500 py-4">No upcoming defenses scheduled</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appointments
                      .filter(apt => apt.status === 'PENDING')
                      .slice(0, 5)
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{appointment.research_title}</p>
                            <p className="text-xs text-gray-500">{appointment.students?.[0]?.name}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedView('pending');
                              setFilters({...filters, status: 'PENDING'});
                              setActiveTab('list');
                            }}
                            className="text-xs"
                          >
                            Review
                          </Button>
                        </div>
                      ))}
                    {appointments.filter(apt => apt.status === 'PENDING').length === 0 && (
                      <p className="text-center text-gray-500 py-4">No pending approvals</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'list' && (
          <>
            {/* Filters */}
            <Card className="mb-6 border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by title, student name, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={filters.acadYear}
                      onValueChange={(value) => setFilters({ ...filters, acadYear: value || "All" })}
                    >
                      <SelectTrigger className="w-32">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {acadYears.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.researchType}
                      onValueChange={(value) => setFilters({ ...filters, researchType: value || "All" })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {researchTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.defenseType}
                      onValueChange={(value) => setFilters({ ...filters, defenseType: value || "All" })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Defense" />
                      </SelectTrigger>
                      <SelectContent>
                        {defenseTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value || "All" })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

                    
        {/* List View */}
        {activeTab === "list" && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Defense Schedule List</h3>
                    <p className="text-white/80 text-sm">Manage and monitor all defense appointments</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedView !== 'all' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setSelectedView('all'); setFilters({...filters, status: 'All'}); }}
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                    <TableRow className="hover:bg-orange-100/50">
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4 w-10"></TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4 min-w-[120px]">Appointment Code</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4 min-w-[250px] max-w-[350px]">Research Title</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4 min-w-[100px]">Status</TableHead>
                      <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4 min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full">
                              <FileText className="h-10 w-10 text-orange-500" />
                            </div>
                            <p className="text-gray-600 font-semibold text-lg">No appointments found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAppointments.map((appointment, index) => (
                        <React.Fragment key={appointment.id}>
                        <TableRow
                          className="hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-red-50/80 transition-all duration-300 border-b border-gray-100 last:border-0"
                        >
                          <TableCell className="py-5 px-4">
                            <button
                              onClick={() => toggleRow(appointment.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {expandedRows.has(appointment.id) ? (
                                <ChevronUp className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="py-5 px-4">
                            <div className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-1 rounded">
                              {appointment.appointment_code}
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-4">
                            <div className="space-y-2">
                              <div className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{appointment.research_title}</div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-500 font-medium">{appointment.acad_year}</span>
                                <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full font-semibold shadow-sm">
                                  {appointment.group_code}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 font-semibold">
                                  {appointment.defense_type}
                                </Badge>
                                <span className="text-gray-600 flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3 text-orange-500" />
                                  {format(new Date(appointment.date), "PP")}
                                </span>
                                <span className="text-gray-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-orange-400" />
                                  {appointment.time_desc}
                                </span>
                                <span className="text-gray-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-blue-600" />
                                  {appointment.room}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-4">
                            <Badge className={`font-bold px-3 py-1.5 text-xs ${getStatusColor(appointment.status)}`} variant="outline">
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5 px-4">
                            <div className="flex gap-2 flex-wrap">
                              {appointment.status === "PENDING" && (
                                <>
                                <Dialog>
                                  <DialogTrigger>
                                    <div
                                      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                                      onClick={() => setSelectedAppointment(appointment)}
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1.5" /> Approve
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl w-full">
                                    <DialogHeader className="pb-4">
                                      <DialogTitle className="text-2xl font-bold text-gray-900">Approve & Schedule Defense</DialogTitle>
                                      <DialogDescription className="text-base text-gray-600">
                                        Assign panel members and confirm the appointment for <span className="font-semibold text-gray-800">{appointment.research_title}</span>
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-6 py-4">
                                      {/* Panelists Section */}
                                      <div className="space-y-4 border-t border-gray-200 pt-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                          <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-orange-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">Defense Panel Members</h3>
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Required</span>
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-600">Assign 1 chairman and 2 panel members for this defense.</p>
                                        
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                          {/* Chairman */}
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                                <Shield className="h-4 w-4 text-orange-600" />
                                              </div>
                                              <Label htmlFor="chairman" className="text-sm font-semibold text-gray-700">Panel Chairman *</Label>
                                            </div>
                                            <Select value={panelists.chairman || ''} onValueChange={(value) => setPanelists({...panelists, chairman: value || ''})}>
                                              <SelectTrigger className="h-11 border-gray-300 w-full">
                                                <SelectValue placeholder="Select panel chairman" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {panelUsers.length === 0 ? (
                                                  <div className="p-2 text-sm text-gray-500">No panel users available</div>
                                                ) : (
                                                  panelUsers.map((user) => (
                                                    <SelectItem key={user.id} value={user.name || user.username || ''}>
                                                      {user.name || user.username || 'Unknown'}
                                                    </SelectItem>
                                                  ))
                                                )}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {/* Members */}
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                  <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <Label htmlFor="member1" className="text-sm font-semibold text-gray-700">Panel Member 1 *</Label>
                                              </div>
                                              <Select value={panelists.member1 || ''} onValueChange={(value) => setPanelists({...panelists, member1: value || ''})}>
                                                <SelectTrigger className="h-11 border-gray-300 w-full">
                                                  <SelectValue placeholder="Select panel member 1" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {panelUsers.length === 0 ? (
                                                    <div className="p-2 text-sm text-gray-500">No panel users available</div>
                                                  ) : (
                                                    panelUsers.map((user) => (
                                                      <SelectItem key={user.id} value={user.name || user.username || ''}>
                                                        {user.name || user.username || 'Unknown'}
                                                      </SelectItem>
                                                    ))
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                  <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <Label htmlFor="member2" className="text-sm font-semibold text-gray-700">Panel Member 2 *</Label>
                                              </div>
                                              <Select value={panelists.member2 || ''} onValueChange={(value) => setPanelists({...panelists, member2: value || ''})}>
                                                <SelectTrigger className="h-11 border-gray-300 w-full">
                                                  <SelectValue placeholder="Select panel member 2" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {panelUsers.length === 0 ? (
                                                    <div className="p-2 text-sm text-gray-500">No panel users available</div>
                                                  ) : (
                                                    panelUsers.map((user) => (
                                                      <SelectItem key={user.id} value={user.name || user.username || ''}>
                                                        {user.name || user.username || 'Unknown'}
                                                      </SelectItem>
                                                    ))
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4">
                                      <div
                                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer w-full sm:w-auto"
                                        onClick={() => {
                                          setSelectedAppointment(null);
                                          setPanelists({ chairman: "", member1: "", member2: "" });
                                          setRescheduleDate(undefined);
                                          setRescheduleTime("");
                                          setRescheduleRoom("");
                                        }}
                                      >
                                        Cancel
                                      </div>
                                      <div
                                        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white w-full sm:w-auto ${
                                          !panelists.chairman || !panelists.member1 || !panelists.member2
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-green-500 hover:bg-green-600 cursor-pointer"
                                        }`}
                                        onClick={() => {
                                          if (panelists.chairman && panelists.member1 && panelists.member2) {
                                            handleApproveWithPanelists(appointment.id);
                                          }
                                        }}
                                      >
                                        <Check className="h-4 w-4 mr-1" /> Approve & Assign Panel
                                      </div>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:shadow-md transition-all text-xs font-bold px-3 py-2"
                                  onClick={() => {
                                    setAppointmentToNotApprove(appointment.id);
                                    setIsNotApproveConfirmOpen(true);
                                  }}
                                >
                                  <X className="h-3.5 w-3.5 mr-1" /> Not Approve
                                </Button>
                                </>
                              )}
                              {appointment.status === "APPROVED" && (
                              <Dialog>
                                <DialogTrigger>
                                  <div
                                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                                    onClick={() => setSelectedAppointment(appointment)}
                                  >
                                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" /> Reschedule
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl w-full">
                                  <DialogHeader className="pb-4">
                                    <DialogTitle className="text-2xl font-bold text-gray-900">Reschedule Defense</DialogTitle>
                                    <DialogDescription className="text-base text-gray-600">
                                      Choose a new date, room, and time for {appointment.research_title}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6 py-4">
                                    {/* Current Schedule Info */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-900">Current Schedule</span>
                                      </div>
                                      <p className="text-sm text-blue-700">
                                        {format(new Date(appointment.date), "PPPP")} at {format(new Date(appointment.date), "p")} - {appointment.room}
                                      </p>
                                    </div>

                                    {/* Date Selection - Card Style */}
                                    <div>
                                      <Label className="text-sm font-medium text-gray-900 mb-3 block">
                                        Select New Date
                                      </Label>
                                      <Popover>
                                        <PopoverTrigger>
                                          <div className="inline-flex items-center justify-center rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm hover:border-gray-300 cursor-pointer w-full transition-all">
                                            <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
                                            {rescheduleDate ? format(rescheduleDate, "PPP") : "Select new date"}
                                          </div>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                          <Calendar
                                            mode="single"
                                            selected={rescheduleDate}
                                            onSelect={setRescheduleDate}
                                            disabled={(date) => date < new Date()}
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>

                                    {/* Room Selection - Card Grid Style */}
                                    {rescheduleDate && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-900 mb-3 block">
                                          Select Room
                                        </Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                          {["LAB 1", "LAB 2", "LAB 3", "CONFERENCE ROOM", "HALL A", "HALL B"].map((room) => (
                                            <div
                                              key={room}
                                              onClick={() => setRescheduleRoom(room)}
                                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                rescheduleRoom === room
                                                  ? 'border-orange-500 bg-orange-50'
                                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-600" />
                                                <span className="font-medium text-gray-900">{room}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Time Slots - Card Grid Style */}
                                    {rescheduleRoom && (
                                      <div>
                                        <Label className="text-sm font-medium text-gray-900 mb-3 block">
                                          Available Time Slots ({availableSlots.length})
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                          {availableSlots.map((slot) => (
                                            <div
                                              key={slot.hour}
                                              onClick={() => setRescheduleTime(slot.time)}
                                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                rescheduleTime === slot.time
                                                  ? 'border-orange-500 bg-orange-50'
                                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-600" />
                                                <span className="font-medium text-gray-900">
                                                  {slot.display || `${slot.time} - ${slot.endTime || 'N/A'}`}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-4">
                                    <div
                                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer w-full sm:w-auto"
                                      onClick={() => {
                                        setSelectedAppointment(null);
                                        setRescheduleDate(undefined);
                                        setRescheduleTime("");
                                        setRescheduleRoom("");
                                      }}
                                    >
                                      Cancel
                                    </div>
                                    {rescheduleDate && rescheduleRoom && rescheduleTime && (
                                      <div
                                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 cursor-pointer w-full sm:w-auto"
                                        onClick={handleReschedule}
                                      >
                                        <CalendarIcon className="h-4 w-4 mr-1" /> Reschedule
                                      </div>
                                    )}
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:shadow-md transition-all text-xs font-bold px-3 py-2"
                                onClick={() => {
                                  setAppointmentToDelete(appointment.id);
                                  setIsDeleteConfirmOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Expandable Row */}
                        {expandedRows.has(appointment.id) && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-4 px-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Team Members */}
                                <div>
                                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Team Members</p>
                                  <div className="space-y-2">
                                    {appointment.students?.map((student, idx) => (
                                      <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                        <div className="font-semibold text-gray-900 text-sm">{student.name}</div>
                                        <div className="text-xs text-gray-600 mt-1">{student.student_id} • {student.course_section}</div>
                                        <Badge variant="outline" className="text-xs mt-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 font-semibold">
                                          {student.role}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Panelists */}
                                <div>
                                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Panelists</p>
                                  {appointment.status === "APPROVED" && appointment.group_code && appointmentsPanelists[appointment.group_code] ? (
                                    <div className="space-y-2">
                                      {appointmentsPanelists[appointment.group_code].map((panelist: any) => (
                                        <div key={panelist.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                            panelist.role === 'CHAIRMAN' ? 'bg-gradient-to-br from-orange-100 to-orange-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                                          }`}>
                                            {panelist.role === 'CHAIRMAN' ? (
                                              <Shield className="h-3.5 w-3.5 text-orange-600" />
                                            ) : (
                                              <User className="h-3.5 w-3.5 text-blue-600" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-semibold text-gray-900 text-xs">{panelist.name}</div>
                                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 font-semibold ${
                                              panelist.role === 'CHAIRMAN'
                                                ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-300'
                                                : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300'
                                            }`}>
                                              {panelist.role}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                      <Users className="h-4 w-4" />
                                      <span>Not assigned</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Section */}
        {activeTab === "users" && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Users Management</h3>
                    <p className="text-white/80 text-sm">Manage system users and roles</p>
                  </div>
                </div>
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger>
                    <div className="inline-flex items-center justify-center rounded-lg bg-white text-orange-600 px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                      <User className="h-4 w-4 mr-1.5" /> Add User
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-bold text-white m-0">Add New User</DialogTitle>
                          <DialogDescription className="text-white/80 text-sm m-0">Create a new user account</DialogDescription>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-5 py-6 px-6">
                      <div className="space-y-2">
                        <Label htmlFor="newUserName" className="text-sm font-semibold text-gray-700">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input 
                            id="newUserName" 
                            type="text" 
                            placeholder="Enter username"
                            className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newUserFullname" className="text-sm font-semibold text-gray-700">Full Name</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input 
                            id="newUserFullname" 
                            placeholder="Enter full name"
                            className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            value={newUser.fullname}
                            onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newUserRole" className="text-sm font-semibold text-gray-700">Role</Label>
                        <div className="relative">
                          <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value || 'PANEL' })}>
                            <SelectTrigger className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                              <SelectItem value="PANEL">Panel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newUserPassword" className="text-sm font-semibold text-gray-700">Password</Label>
                        <div className="relative">
                          <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input 
                            id="newUserPassword" 
                            type="password" 
                            placeholder="Enter password"
                            className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="px-6 pb-6">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                        onClick={() => {
                          setIsAddUserDialogOpen(false);
                          setNewUser({ username: '', fullname: '', role: 'PANEL', password: '' });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                        onClick={handleAddUser}
                      >
                        Add User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                    <TableRow>
                      <TableHead className="font-bold text-orange-900">Username</TableHead>
                      <TableHead className="font-bold text-orange-900">Full Name</TableHead>
                      <TableHead className="font-bold text-orange-900">Role</TableHead>
                      <TableHead className="font-bold text-orange-900">Status</TableHead>
                      <TableHead className="font-bold text-orange-900">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full">
                              <Users className="h-8 w-8 text-orange-500" />
                            </div>
                            <p className="text-orange-700 font-semibold">No users found</p>
                            <p className="text-orange-500 text-sm">Add your first user to get started</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id} className="hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-red-50/50 transition-all duration-200 border-b border-gray-100 last:border-0">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white font-semibold">
                                {user.username?.substring(0, 2).toUpperCase() || 'UN'}
                              </div>
                              <div className="font-semibold text-gray-900">{user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-gray-700">{user.fullname}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${
                              user.role === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                : user.role === 'SUPERADMIN'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all px-3 py-1.5"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditUserDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:shadow-md transition-all px-3 py-1.5"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <X className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white m-0">Delete Appointment</DialogTitle>
                  <DialogDescription className="text-white/80 text-sm m-0">This action cannot be undone</DialogDescription>
                </div>
              </div>
            </div>
            <div className="py-6 px-6">
              <p className="text-gray-700">Are you sure you want to delete this appointment? This will also delete all associated panelists and students.</p>
            </div>
            <DialogFooter className="px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setAppointmentToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  if (appointmentToDelete) {
                    handleDeleteAppointment(appointmentToDelete);
                    setIsDeleteConfirmOpen(false);
                    setAppointmentToDelete(null);
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Not Approve Confirmation Dialog */}
        <Dialog open={isNotApproveConfirmOpen} onOpenChange={setIsNotApproveConfirmOpen}>
          <DialogContent className="max-w-md">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <X className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white m-0">Not Approve Appointment</DialogTitle>
                  <DialogDescription className="text-white/80 text-sm m-0">This action cannot be undone</DialogDescription>
                </div>
              </div>
            </div>
            <div className="py-6 px-6">
              <p className="text-gray-700">Are you sure you want to mark this appointment as "Not Approved"? This will reject the defense schedule.</p>
            </div>
            <DialogFooter className="px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setIsNotApproveConfirmOpen(false);
                  setAppointmentToNotApprove(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  if (appointmentToNotApprove) {
                    handleUpdateStatus(appointmentToNotApprove, "NOT APPROVED");
                    setIsNotApproveConfirmOpen(false);
                    setAppointmentToNotApprove(null);
                  }
                }}
              >
                Not Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="max-w-md">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-white m-0">Edit User</DialogTitle>
                  <DialogDescription className="text-white/80 text-sm m-0">Update user information</DialogDescription>
                </div>
              </div>
            </div>
            {selectedUser && (
              <div className="space-y-5 py-6 px-6">
                <div className="space-y-2">
                  <Label htmlFor="editUserName" className="text-sm font-semibold text-gray-700">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="editUserName" 
                      placeholder="Username"
                      className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      value={selectedUser.username}
                      onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUserFullname" className="text-sm font-semibold text-gray-700">Full Name</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="editUserFullname" 
                      placeholder="Full Name"
                      className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      value={selectedUser.fullname}
                      onChange={(e) => setSelectedUser({ ...selectedUser, fullname: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUserRole" className="text-sm font-semibold text-gray-700">Role</Label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value || 'PANEL' })}>
                      <SelectTrigger className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                        <SelectItem value="PANEL">Panel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUserPassword" className="text-sm font-semibold text-gray-700">New Password (Optional)</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      id="editUserPassword" 
                      type="password"
                      placeholder="Leave empty to keep current password"
                      className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      value={selectedUser.password || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Leave empty to keep the current password</p>
                </div>
              </div>
            )}
            <DialogFooter className="px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1 h-11 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setIsEditUserDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                onClick={handleEditUser}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
