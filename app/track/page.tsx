"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, GraduationCap, CalendarDays, Calendar, Clock, MapPin, Users, FileText, AlertCircle, CheckCircle, XCircle, TrendingUp, Building, Loader2, User, Mail, Eye, Star, Search } from "lucide-react";

interface Appointment {
  id: string;
  tracking_number: string;
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
  created_at: string;
  updated_at: string;
  students?: Array<{
    student_id: string;
    name: string;
    email: string;
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
              href="/auth/login" 
              className={`font-medium transition-colors ${
                isActive("/auth/login") 
                  ? "text-orange-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              LOGIN
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<Appointment | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const handleTrackByNumber = async () => {
    if (!trackingNumber.trim()) {
      setTrackingError("Please enter a tracking number");
      return;
    }

    setIsTracking(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      const response = await fetch(`/api/appointments?tracking_number=${trackingNumber.trim()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setTrackingResult(data[0]);
        } else {
          setTrackingError("No appointment found with this tracking number");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Track error:', errorData);
        setTrackingError(errorData.error || "Failed to fetch appointment details");
      }
    } catch (error) {
      console.error('Track fetch error:', error);
      setTrackingError("Error fetching appointment details");
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED": return "bg-green-100 text-green-800 border-green-200";
      case "NOT APPROVED": return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <AlertCircle className="h-4 w-4" />;
      case "APPROVED": return <CheckCircle className="h-4 w-4" />;
      case "NOT APPROVED": return <XCircle className="h-4 w-4" />;
      case "COMPLETED": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Search className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Track Your Defense</h1>
                <p className="text-gray-600">Monitor the status of your defense appointment</p>
              </div>
            </div>
          </div>

          {/* Track by Number */}
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-gray-900">Track by Tracking Number</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Enter your tracking number..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleTrackByNumber()}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleTrackByNumber}
                  disabled={isTracking}
                  className="h-12 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isTracking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </div>
              {trackingError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{trackingError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Result - Simplified Card */}
          {trackingResult && (
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Appointment Details</CardTitle>
                  <Badge className={`bg-white text-orange-600 font-bold ${getStatusColor(trackingResult.status)}`}>
                    {trackingResult.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Tracking Number */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tracking Number</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{trackingResult.tracking_number}</p>
                </div>

                {/* Research Title */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Research Title</p>
                  <p className="text-base font-semibold text-gray-900">{trackingResult.research_title}</p>
                </div>

                {/* Grid for details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Group Code</p>
                    <p className="font-semibold text-gray-900">{trackingResult.group_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Research Type</p>
                    <p className="font-semibold text-gray-900">{trackingResult.research_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Defense Type</p>
                    <p className="font-semibold text-gray-900">{trackingResult.defense_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Adviser</p>
                    <p className="font-semibold text-gray-900 text-sm">{trackingResult.adviser_name}</p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Defense Schedule</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {new Date(trackingResult.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Time</p>
                      <p className="font-semibold text-gray-900 text-sm">{trackingResult.time_desc}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Room</p>
                      <p className="font-semibold text-gray-900 text-sm">{trackingResult.room}</p>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                {trackingResult.students && trackingResult.students.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Team Members</p>
                    <div className="space-y-2">
                      {trackingResult.students.map((student, index) => (
                        <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <User className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                            <p className="text-xs text-gray-600">{student.role} • {student.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
