"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, FileText, User, Shield, CheckCircle, XCircle, GraduationCap } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_code: string;
  research_title: string;
  group_code: string;
  date: string;
  time_desc: string;
  room: string;
  status: string;
  research_type: string;
  defense_type: string;
  acad_year: string;
  students?: Array<{
    student_id: string;
    name: string;
    email: string;
    course_section: string;
    role: string;
  }>;
}

interface Panelist {
  id: string;
  name: string;
  role: string;
}

export default function PanelDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const parseSessionCookie = () => {
    const cookies = document.cookie.split(';').reduce((acc: any, cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    console.log('All cookies:', cookies);
    const sessionCookie = cookies['session'];
    console.log('Session cookie value:', sessionCookie);
    console.log('Session cookie length:', sessionCookie?.length);
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
        console.log('Parsed session data:', sessionData);
        console.log('Session role:', sessionData.role);
        console.log('Session role type:', typeof sessionData.role);
        console.log('Is role PANEL?', sessionData.role === 'PANEL');
        return sessionData;
      } catch (error) {
        console.error('Error parsing session cookie:', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = parseSessionCookie();
        console.log('Panel session:', session);
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push("/auth/login");
          return;
        }
        if (session.role !== "PANEL") {
          console.log('Invalid role:', session.role, 'redirecting to student');
          router.push("/student");
          return;
        }
        console.log('Session valid, setting user');
        setUser(session);
        fetchAssignedAppointments(session.name || session.username || "");
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/auth/login");
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAssignedAppointments = async (panelistName: string) => {
    try {
      setIsLoading(true);
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'APPROVED');

      if (error) throw error;

      // Filter appointments where this panelist is assigned
      const assignedAppointments = await Promise.all(
        (appointmentsData || []).map(async (apt) => {
          const { data: panelists } = await supabase
            .from('panelists')
            .select('*')
            .eq('group_code', apt.group_code);

          const isAssigned = panelists?.some((p: Panelist) => p.name === panelistName);

          if (isAssigned) {
            const { data: students } = await supabase
              .from('students')
              .select('*')
              .eq('appointment_code', apt.appointment_code);
            return { ...apt, students: students || [] };
          }
          return null;
        })
      );

      setAppointments(assignedAppointments.filter((apt): apt is Appointment => apt !== null));
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "NOT APPROVED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b-2 border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                CITE Defense
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.name || user?.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  router.push('/auth/login');
                }}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            {["dashboard", "evaluate", "verdict"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">My Assigned Researches</CardTitle>
                <Badge className="bg-white/20 text-white border-white/30">
                  {appointments.length} Research{appointments.length !== 1 ? "es" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : appointments.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No assigned researches found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                      <TableRow>
                        <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4">Research Title</TableHead>
                        <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4">Group Code</TableHead>
                        <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4">Date & Time</TableHead>
                        <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4">Room</TableHead>
                        <TableHead className="font-bold text-gray-800 text-xs uppercase tracking-wider py-4 px-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow
                          key={appointment.id}
                          className="hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-red-50/80 transition-all duration-300 border-b border-gray-100 last:border-0"
                        >
                          <TableCell className="py-4 px-4">
                            <div className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{appointment.research_title}</div>
                            <div className="text-xs text-gray-500 mt-1">{appointment.acad_year}</div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-1 rounded-full font-semibold shadow-sm">
                              {appointment.group_code}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                {format(new Date(appointment.date), "PP")}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                <Clock className="h-3 w-3 text-orange-400" />
                                {appointment.time_desc}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3 py-2 border border-blue-200 shadow-sm">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-bold text-blue-900">{appointment.room}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge className={`font-bold px-3 py-1.5 text-xs ${getStatusColor(appointment.status)}`} variant="outline">
                              {appointment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "evaluate" && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white">
              <CardTitle className="text-2xl font-bold">Evaluate Research</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Research to Evaluate</label>
                  <Select onValueChange={(value) => {
                    const apt = appointments.find(a => a.id === value);
                    setSelectedAppointment(apt || null);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a research..." />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments.map((appointment) => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {appointment.research_title} - {appointment.group_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAppointment && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                      <h3 className="font-bold text-gray-900 mb-2">{selectedAppointment.research_title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full font-semibold">
                          {selectedAppointment.group_code}
                        </span>
                        <span>•</span>
                        <span>{selectedAppointment.research_type}</span>
                      </div>
                    </div>

                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>Evaluation form will be displayed here</p>
                      <p className="text-sm mt-2">Form structure to be defined</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "verdict" && (
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white">
              <CardTitle className="text-2xl font-bold">My Verdicts</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Your scores and verdicts will be displayed here</p>
                <p className="text-sm mt-2">Scores structure to be defined</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
