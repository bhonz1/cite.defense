"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, Clock, MapPin, Shield, User, ChevronRight, Loader2 } from "lucide-react";
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
  group_code: string;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsPanelists, setAppointmentsPanelists] = useState<Record<string, Panelist[]>>({});
  const [isLoading, setIsLoading] = useState(true);
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
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all approved appointments
        const appointmentsResponse = await fetch('/api/appointments');
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          const approvedAppointments = appointmentsData.filter((apt: Appointment) => apt.status === 'APPROVED');
          setAppointments(approvedAppointments);

          // Fetch panelists for each approved appointment
          const panelistsPromises = approvedAppointments
            .filter((apt: Appointment) => apt.group_code)
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
          const panelistsMap: Record<string, Panelist[]> = {};
          panelistsResults.forEach(result => {
            panelistsMap[result.groupCode] = result.panelists;
          });
          setAppointmentsPanelists(panelistsMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'NOT APPROVED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Panelist Schedules</h1>
          <p className="text-gray-600">View all approved defense schedules and assigned panelists</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full inline-block mb-4">
                <Calendar className="h-10 w-10 text-orange-500" />
              </div>
              <p className="text-gray-500">No approved defense schedules available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-md hover:shadow-xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`font-semibold ${getResearchTypeColor(appointment.research_type)}`}>
                          {appointment.research_type}
                        </Badge>
                        <Badge className={`font-semibold ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-gray-900">{appointment.research_title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span>{appointment.date ? format(new Date(appointment.date), 'MMM dd, yyyy') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <span>{appointment.time_desc}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span>{appointment.room}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRow(appointment.id)}
                      className="flex-shrink-0"
                    >
                      <ChevronRight 
                        className={`h-5 w-5 transition-transform ${
                          expandedRows.has(appointment.id) ? 'rotate-90' : ''
                        }`} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                
                {expandedRows.has(appointment.id) && (
                  <CardContent className="pt-0 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Students */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Team Members</h4>
                        <div className="space-y-2">
                          {appointment.students?.map((student, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Panelists</h4>
                        {appointmentsPanelists[appointment.group_code] ? (
                          <div className="space-y-2">
                            {appointmentsPanelists[appointment.group_code].map((panelist) => (
                              <div key={panelist.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
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
                            <User className="h-4 w-4" />
                            <span>No panelists assigned</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
