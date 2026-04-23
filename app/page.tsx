"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, GraduationCap, CalendarDays, Calendar, Clock, MapPin, Users, FileText, AlertCircle, CheckCircle, XCircle, TrendingUp, Building, Loader2 } from "lucide-react";
import { createClient } from '@/utils/supabase/client';

interface Appointment {
  id: string;
  research_title: string;
  group_code: string;
  date: string;
  time_desc: string;
  room: string;
  status: string;
  research_type: string;
  defense_type: string;
}

const defenseDates = [
  { date: "2026-05-08", label: "May 8, 2026", type: "THESIS - FINAL" },
  { date: "2026-05-11", label: "May 11, 2026", type: "CAPSTONE - PROPOSAL" },
  { date: "2026-05-12", label: "May 12, 2026", type: "CAPSTONE - PROPOSAL" },
];

const timeSlots = [
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "01:00 PM - 03:00 PM",
  "03:00 PM - 05:00 PM",
];

const rooms = ["ITE102", "DEFENSE ROOM", "ITE201", "ITE202", "ITE203"];

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
              href="/auth/panel-login" 
              className={`font-medium transition-colors ${
                isActive("/auth/panel-login") 
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

export default function LandingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [researchFilter, setResearchFilter] = useState<'ALL' | 'THESIS' | 'CAPSTONE'>('ALL');

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    fetchAppointments();

    // Set up real-time subscription
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Real-time change received:', payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      // Fetch both APPROVED and PENDING appointments to show all scheduled defenses
      const [approvedRes, pendingRes] = await Promise.all([
        fetch('/api/appointments?status=APPROVED'),
        fetch('/api/appointments?status=PENDING')
      ]);

      if (approvedRes.ok && pendingRes.ok) {
        const approvedData = await approvedRes.json();
        const pendingData = await pendingRes.json();
        setAppointments([...approvedData, ...pendingData]);
        setLastUpdated(new Date());
      } else if (approvedRes.ok) {
        const data = await approvedRes.json();
        setAppointments(data);
        setLastUpdated(new Date());
      } else if (pendingRes.ok) {
        const data = await pendingRes.json();
        setAppointments(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduledDefense = (date: string, timeSlot: string, room: string) => {
    return appointments.find(apt => 
      apt.date === date && 
      apt.time_desc === timeSlot && 
      apt.room === room &&
      (apt.status === 'APPROVED' || apt.status === 'PENDING')
    );
  };

  const isSlotAvailable = (date: string, timeSlot: string, room: string) => {
    return !getScheduledDefense(date, timeSlot, room);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-white min-h-[calc(100vh-8rem)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 text-sm font-medium mb-8 shadow-lg">
                <span className="flex h-3 w-3 rounded-full bg-orange-500 animate-pulse"></span>
                Now Scheduling 2024-2025 Academic Year
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Schedule Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-800">Defense</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                Streamlined appointment scheduling for Capstone and Thesis defenses. 
                Book your slot, track your status, and focus on what matters most—your research.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link href="/schedule">
                  <Button className="px-10 py-4 text-lg font-medium bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Schedule Defense
                  </Button>
                </Link>
                <Link href="/track">
                  <Button variant="outline" className="px-10 py-4 text-lg font-medium border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition-all duration-300 transform hover:scale-105">
                    Track Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule View Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <CalendarDays className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900">Defense Schedule</h2>
                {lastUpdated && (
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500">
                      Live · Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-6">
                View scheduled defenses and check available time slots. Green slots are available, while red slots show booked defenses with group information.
              </p>
              
              {/* Filter Buttons */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Button
                  onClick={() => setResearchFilter('ALL')}
                  variant={researchFilter === 'ALL' ? 'default' : 'outline'}
                  className={researchFilter === 'ALL'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0'
                    : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  }
                >
                  All Schedules
                </Button>
                <Button
                  onClick={() => setResearchFilter('THESIS')}
                  variant={researchFilter === 'THESIS' ? 'default' : 'outline'}
                  className={researchFilter === 'THESIS'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0'
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  THESIS
                </Button>
                <Button
                  onClick={() => setResearchFilter('CAPSTONE')}
                  variant={researchFilter === 'CAPSTONE' ? 'default' : 'outline'}
                  className={researchFilter === 'CAPSTONE'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0'
                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                  }
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CAPSTONE
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={fetchAppointments}
                  variant="outline"
                  className="gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  Refresh Schedule
                </Button>
                <span className="text-sm text-gray-500">
                  Auto-refreshes every 30 seconds
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-sm text-gray-600">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">THESIS</Badge>
                <span className="text-sm text-gray-600">Final Defense</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800">CAPSTONE</Badge>
                <span className="text-sm text-gray-600">Proposal Defense</span>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-gray-600">Loading schedule...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {defenseDates
                  .filter(dateInfo => {
                    if (researchFilter === 'ALL') return true;
                    return dateInfo.type.startsWith(researchFilter);
                  })
                  .map((dateInfo) => (
                  <Card key={dateInfo.date} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                    <div className={`bg-gradient-to-r p-6 ${
                      dateInfo.type.startsWith('THESIS')
                        ? 'from-green-500 to-green-600'
                        : 'from-blue-500 to-blue-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-6 w-6 text-white" />
                          <h3 className="text-2xl font-bold text-white">{dateInfo.label}</h3>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                          {dateInfo.type}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                        {timeSlots.map(timeSlot => (
                          <div key={timeSlot} className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="font-semibold text-gray-900">{timeSlot}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {rooms.map(room => {
                                const defense = getScheduledDefense(dateInfo.date, timeSlot, room);
                                const available = isSlotAvailable(dateInfo.date, timeSlot, room);
                                
                                return (
                                  <div
                                    key={`${timeSlot}-${room}`}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                                      defense 
                                        ? defense.status === 'PENDING'
                                          ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                                          : 'bg-green-50 border-green-200 hover:border-green-300'
                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {defense ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          {defense.status === 'PENDING' ? (
                                            <>
                                              <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                              <span className="text-xs font-medium text-yellow-900">Pending</span>
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                              <span className="text-xs font-medium text-green-900">Approved</span>
                                            </>
                                          )}
                                        </div>
                                        <div className="space-y-1">
                                          <p className={`text-sm font-bold truncate ${defense.status === 'PENDING' ? 'text-yellow-900' : 'text-green-900'}`} title={defense.group_code}>
                                            {defense.group_code}
                                          </p>
                                          <p className={`text-xs line-clamp-2 ${defense.status === 'PENDING' ? 'text-yellow-700' : 'text-green-700'}`} title={defense.research_title}>
                                            {defense.research_title}
                                          </p>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs ${defense.status === 'PENDING' ? 'text-yellow-600' : 'text-green-600'}`}>
                                          <MapPin className="h-3 w-3" />
                                          <span>{room}</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
                                        <CheckCircle className="h-8 w-8 text-gray-500 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Available</span>
                                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                          <MapPin className="h-3 w-3" />
                                          <span>{room}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            {!isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{defenseDates.length}</p>
                    <p className="text-sm text-gray-600">Defense Dates</p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{timeSlots.length}</p>
                    <p className="text-sm text-gray-600">Time Slots per Day</p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
                    <p className="text-sm text-gray-600">Defense Rooms</p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                    <p className="text-sm text-gray-600">Scheduled Defenses</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          © 2026 Defense Scheduler. All rights reserved. Developed by Von Gabayan Jr.
        </div>
      </footer>
    </div>
  );
}
