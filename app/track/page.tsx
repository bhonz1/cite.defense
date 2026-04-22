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

          {/* Tracking Result - Professional Certificate */}
          {trackingResult && (
            <div className="mb-6">
              <div className="max-w-4xl mx-auto bg-white shadow-2xl">
                {/* Certificate Content */}
                <div className="p-12">
                        
                        {/* Certificate Header */}
                        <div className="text-center mb-8">
                          {/* Certificate Title */}
                          <div className="mb-6">
                            <h1 className="text-4xl font-serif font-bold text-black mb-2 tracking-wide">
                              REQUEST FOR DEFENSE SCHEDULE
                            </h1>
                            <div className="flex justify-center">
                              <div className="h-1 w-32 bg-black"></div>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex justify-center">
                            <div className={`px-6 py-3 rounded-full border-2 ${getStatusColor(trackingResult.status)} bg-white shadow-lg`}>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(trackingResult.status)}
                                <span className="font-bold text-lg">{trackingResult.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Certificate Body */}
                        <div className="space-y-8">
                          
                          {/* Tracking Number */}
                          <div className="text-center">
                            <div className="inline-block bg-gray-100 border-2 border-black rounded-lg px-8 py-4">
                              <p className="text-sm font-bold text-black uppercase tracking-wider mb-1">Tracking Number</p>
                              <p className="text-2xl font-mono font-bold text-black">{trackingResult.tracking_number}</p>
                            </div>
                          </div>

                          {/* Research Title */}
                          <div className="text-center py-6 bg-gray-100 rounded-lg border-2 border-gray-800">
                            <h2 className="text-2xl font-serif font-bold text-black leading-tight px-8">
                              {trackingResult.research_title}
                            </h2>
                          </div>

                          {/* Two Column Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                              <div className="bg-white rounded-lg border-2 border-gray-800 p-4">
                                <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Group Information</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between border-b border-gray-300 pb-1">
                                    <span className="text-sm text-gray-600">Group Code:</span>
                                    <span className="font-semibold text-black">{trackingResult.group_code}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Research Type:</span>
                                    <span className="font-semibold text-black">{trackingResult.research_type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Defense Type:</span>
                                    <span className="font-semibold text-black">{trackingResult.defense_type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg border-2 border-gray-800 p-4">
                                <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Research Adviser</p>
                                <p className="font-semibold text-black">{trackingResult.adviser_name}</p>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                              <div className="bg-white rounded-lg border-2 border-gray-800 p-4">
                                <p className="text-xs font-bold text-black uppercase tracking-wider mb-2">Defense Schedule</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between border-b border-gray-300 pb-1">
                                    <span className="text-sm text-gray-600">Date:</span>
                                    <span className="font-semibold text-black">
                                      {new Date(trackingResult.date).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b border-gray-300 pb-1">
                                    <span className="text-sm text-gray-600">Time:</span>
                                    <span className="font-semibold text-black">{trackingResult.time_desc}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Room:</span>
                                    <span className="font-semibold text-black">{trackingResult.room}</span>
                                  </div>
                                </div>
                              </div>

                                                          </div>
                          </div>

                          {/* Team Members */}
                          {trackingResult.students && trackingResult.students.length > 0 && (
                            <div className="bg-white rounded-lg border-2 border-gray-800 p-6">
                              <h3 className="text-lg font-serif font-bold text-black mb-4 text-center">Defense Team Members</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {trackingResult.students.map((student, index) => (
                                  <div key={index} className="bg-gray-100 rounded-lg border border-gray-800 p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold text-black text-sm">{student.name}</p>
                                        <p className="text-xs text-gray-700 font-medium">{student.role}</p>
                                        <p className="text-xs text-gray-600">{student.email}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Certificate Footer */}
                        <div className="mt-12 pt-8 border-t-4 border-gray-800">
                          <div className="flex justify-center items-center">
                            {/* Left Side - Date */}
                            <div className="text-center">
                              <p className="text-sm font-bold text-black uppercase tracking-wider mb-2">Date of Issue</p>
                              <p className="font-semibold text-black">
                                {new Date(trackingResult.created_at).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>

                            
                                                      </div>

                          {/* Bottom Text */}
                          <div className="text-center mt-8">
                            <p className="text-xs text-gray-700 italic">
                              This certificate is electronically generated and serves as official documentation of the defense appointment.
                            </p>
                          </div>
                        </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
