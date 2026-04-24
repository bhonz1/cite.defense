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
              href="/defense-schedule" 
              className={`font-medium transition-colors ${
                isActive("/defense-schedule") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              CALENDAR
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

      console.log('Approved response:', approvedRes.ok);
      console.log('Pending response:', pendingRes.ok);

      if (approvedRes.ok && pendingRes.ok) {
        const approvedData = await approvedRes.json();
        const pendingData = await pendingRes.json();
        console.log('Approved data:', approvedData);
        console.log('Pending data:', pendingData);
        setAppointments([...approvedData, ...pendingData]);
        setLastUpdated(new Date());
      } else if (approvedRes.ok) {
        const data = await approvedRes.json();
        console.log('Approved data only:', data);
        setAppointments(data);
        setLastUpdated(new Date());
      } else if (pendingRes.ok) {
        const data = await pendingRes.json();
        console.log('Pending data only:', data);
        setAppointments(data);
        setLastUpdated(new Date());
      } else {
        console.log('No appointments found, setting empty array');
        setAppointments([]);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
      setLastUpdated(new Date());
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

  // Extract unique dates from appointments, with fallback dates if empty
  const defenseDates = appointments.length > 0
    ? appointments.reduce((acc: any[], apt) => {
        const exists = acc.find(d => d.date === apt.date);
        if (!exists) {
          const dateObj = new Date(apt.date);
          acc.push({
            date: apt.date,
            label: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            type: `${apt.research_type} - ${apt.defense_type}`
          });
        }
        return acc;
      }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [
        { date: "2026-05-08", label: "May 8, 2026", type: "THESIS - FINAL" },
        { date: "2026-05-11", label: "May 11, 2026", type: "CAPSTONE - PROPOSAL" },
        { date: "2026-05-12", label: "May 12, 2026", type: "CAPSTONE - PROPOSAL" },
      ];

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
