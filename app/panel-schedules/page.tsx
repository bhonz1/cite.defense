"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, User, Shield, Calendar as CalendarIcon, Clock, Loader2, X, FileText, Users, UserCheck } from "lucide-react";
import { format } from "date-fns";

interface PanelistStat {
  name: string;
  totalAppointments: number;
  chairmanCount: number;
  memberCount: number;
  groupCodes: Array<{
    code: string;
    date: string;
    time: string;
    researchType: string;
  }>;
}

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
  adviser_name?: string;
  students?: Array<{
    student_id: string;
    name: string;
    email: string;
    course_section: string;
    role: string;
  }>;
}

function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-md fixed w-full z-50 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-orange-500" />
            <span className="font-bold text-xl text-gray-900">DefenseScheduler</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`font-medium transition-colors ${
                isActive("/") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              HOME
            </Link>
            <Link 
              href="/track" 
              className={`font-medium transition-colors ${
                isActive("/track") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              TRACK
            </Link>
            <Link 
              href="/schedule" 
              className={`font-medium transition-colors ${
                isActive("/schedule") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              SCHEDULE
            </Link>
            <Link 
              href="/panel-schedules" 
              className={`font-medium transition-colors ${
                isActive("/panel-schedules") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              PANEL
            </Link>
            <Link 
              href="/auth/login" 
              className={`font-medium transition-colors ${
                isActive("/auth/login") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ADMIN
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function PanelSchedules() {
  const [panelistStats, setPanelistStats] = useState<PanelistStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchPanelistStats = async () => {
      try {
        // Fetch all panelists from the panelist table
        const panelistsResponse = await fetch('/api/panelists');
        if (!panelistsResponse.ok) {
          console.error('Failed to fetch panelists');
          setPanelistStats([]);
          return;
        }
        const panelistsData = await panelistsResponse.json();

        // Fetch all appointments to get research types and schedule
        const appointmentsResponse = await fetch('/api/appointments');
        if (!appointmentsResponse.ok) {
          console.error('Failed to fetch appointments');
          setPanelistStats([]);
          return;
        }
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);

        // Create a map of group_code to research_type and schedule
        const groupCodeInfo: Record<string, { researchType: string; date: string; time: string }> = {};
        appointmentsData.forEach((apt: any) => {
          groupCodeInfo[apt.group_code] = {
            researchType: apt.research_type,
            date: apt.date,
            time: apt.time_desc
          };
        });

        // Group panelists by name only (merge Thesis and Capstone)
        const stats = panelistsData.reduce((acc: any, panelist: any) => {
          const name = panelist.name;
          const info = groupCodeInfo[panelist.group_code] || { researchType: 'UNKNOWN', date: '', time: '' };
          const key = name;

          if (!acc[key]) {
            acc[key] = {
              name: name,
              totalAppointments: 0,
              chairmanCount: 0,
              memberCount: 0,
              groupCodes: [] as Array<{ code: string; date: string; time: string; researchType: string }>
            };
          }
          acc[key].totalAppointments += 1;
          if (panelist.role === 'CHAIRMAN') {
            acc[key].chairmanCount += 1;
          } else {
            acc[key].memberCount += 1;
          }
          if (!acc[key].groupCodes.find((gc: any) => gc.code === panelist.group_code)) {
            acc[key].groupCodes.push({
              code: panelist.group_code,
              date: info.date,
              time: info.time,
              researchType: info.researchType
            });
          }
          return acc;
        }, {});

        // Sort groupCodes by date and time for each stat
        Object.values(stats).forEach((stat: any) => {
          stat.groupCodes.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
              return dateA - dateB;
            }
            // If same date, sort by time
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
          });
        });

        setPanelistStats(Object.values(stats));
      } catch (error) {
        console.error('Fetch panelist stats error:', error);
        setPanelistStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPanelistStats();
  }, []);

  const handleGroupCodeClick = (groupCode: string) => {
    const appointment = appointments.find(apt => apt.group_code === groupCode);
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsModalOpen(true);
    }
  };

  const getResearchTypeColor = (type: string) => {
    return type === 'THESIS' 
      ? 'bg-blue-100 text-blue-700 border-blue-200' 
      : 'bg-purple-100 text-purple-700 border-purple-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      <Navigation />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Panelist Schedules</h3>
                <p className="text-white/80 text-sm">Summary of Research/Appointments per panel member</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              </div>
            ) : panelistStats.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full inline-block mb-4">
                  <Shield className="h-10 w-10 text-orange-500" />
                </div>
                <p className="text-gray-500">No panelist data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {panelistStats.map((stat, index) => (
                  <Card key={index} className="border-gray-200 hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{stat.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Chairman: {stat.chairmanCount}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">Member: {stat.memberCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                          <span className="text-sm text-gray-600">Total Appointments</span>
                          <span className="font-bold text-gray-900">{stat.totalAppointments}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Group Codes & Schedule:</p>
                        <div className="flex flex-col gap-2">
                          {stat.groupCodes.map((gc, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-semibold flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
                                  gc.researchType === 'THESIS'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-purple-100 text-purple-700 border-purple-200'
                                }`}
                                onClick={() => handleGroupCodeClick(gc.code)}
                              >
                                {gc.code}
                              </Badge>
                              <Badge variant="outline" className={`text-xs font-semibold flex-shrink-0 ${
                                gc.researchType === 'THESIS'
                                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                                  : 'bg-purple-50 text-purple-600 border-purple-200'
                              }`}>
                                {gc.researchType}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{gc.date ? format(new Date(gc.date), 'MMM dd, yyyy') : 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>{gc.time || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Appointment Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">Appointment Details</DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">{selectedAppointment?.group_code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6 py-4">
              {/* Research Title */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Research Title</span>
                </div>
                <p className="text-gray-900 font-semibold">{selectedAppointment.research_title}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <Badge className={`font-semibold ${getResearchTypeColor(selectedAppointment.research_type)}`}>
                    {selectedAppointment.research_type}
                  </Badge>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                    {selectedAppointment.defense_type}
                  </Badge>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Date</span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {selectedAppointment.date ? format(new Date(selectedAppointment.date), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Time</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{selectedAppointment.time_desc}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Room</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{selectedAppointment.room}</p>
                </div>
              </div>

              {/* Adviser */}
              {selectedAppointment.adviser_name && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Adviser</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{selectedAppointment.adviser_name}</p>
                </div>
              )}

              {/* Group Members */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Group Members</span>
                </div>
                <div className="space-y-2">
                  {selectedAppointment.students && selectedAppointment.students.length > 0 ? (
                    selectedAppointment.students.map((student, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{student.student_id} • {student.course_section}</div>
                          </div>
                          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 font-semibold flex-shrink-0">
                            {student.role}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No group members information available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
