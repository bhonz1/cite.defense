"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, Clock, MapPin, Users, FileText, AlertCircle, CheckCircle, XCircle, Plus, Search, Filter, TrendingUp, Building, X } from "lucide-react";

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

export default function SchedulePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Dynamic Selection
  const [selectedResearchType, setSelectedResearchType] = useState("");
  const [selectedDefenseType, setSelectedDefenseType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableDates, setAvailableDates] = useState<typeof defenseDates>([]);
  const [availableRooms, setAvailableRooms] = useState<typeof rooms>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<typeof timeSlots>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Define team member type
  type TeamMember = {
    name: string;
    studentId: string;
    courseSection: string;
    role: string;
  };

  // Step 2: Information Input
  const [groupCode, setGroupCode] = useState("");
  const [researchTitle, setResearchTitle] = useState("");
  const [adviserName, setAdviserName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{
    name: "",
    studentId: "",
    courseSection: "",
    role: "TEAM LEADER"
  }]);

  // Step 3: Confirmation
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const generateTrackingNumber = () => {
    const prefix = selectedResearchType === "CAPSTONE" ? "CP" : "TH";
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, {
      name: "",
      studentId: "",
      courseSection: "",
      role: "MEMBER"
    }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    setTeamMembers(updatedMembers);
  };

  
  // Add useEffect for fetching appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update available dates when research type and defense type change
  useEffect(() => {
    if (selectedResearchType && selectedDefenseType) {
      const filteredDates = defenseDates.filter(date => 
        date.type === `${selectedResearchType} - ${selectedDefenseType}`
      );
      setAvailableDates(filteredDates);
      // Reset dependent selections
      setSelectedDate("");
      setSelectedRoom("");
      setSelectedTime("");
      setAvailableRooms([]);
      setAvailableTimeSlots([]);
    }
  }, [selectedResearchType, selectedDefenseType]);

  // Update available rooms when date is selected
  useEffect(() => {
    if (selectedDate) {
      // Show all rooms regardless of availability
      setAvailableRooms(rooms);
      
      // Reset dependent selections
      setSelectedRoom("");
      setSelectedTime("");
      setAvailableTimeSlots([]);
    }
  }, [selectedDate]);

  // Update available time slots when date and room are selected
  useEffect(() => {
    if (selectedDate && selectedRoom) {
      // Filter time slots based on availability for selected date and room
      // Count both APPROVED and PENDING appointments as occupied
      const occupiedSlots = appointments.filter(apt => 
        apt.date === selectedDate && 
        apt.room === selectedRoom && 
        (apt.status === 'APPROVED' || apt.status === 'PENDING')
      );
      
      const occupiedTimes = new Set(occupiedSlots.map(apt => apt.time_desc));
      const availableTimeList = timeSlots.filter(slot => !occupiedTimes.has(slot));
      setAvailableTimeSlots(availableTimeList);
      
      // Reset time selection
      setSelectedTime("");
    }
  }, [selectedDate, selectedRoom, appointments]);

  const fetchAppointments = async () => {
    try {
      // Fetch both APPROVED and PENDING appointments to show all occupied slots
      const [approvedRes, pendingRes] = await Promise.all([
        fetch('/api/appointments?status=APPROVED'),
        fetch('/api/appointments?status=PENDING')
      ]);
      
      if (approvedRes.ok && pendingRes.ok) {
        const approvedData = await approvedRes.json();
        const pendingData = await pendingRes.json();
        setAppointments([...approvedData, ...pendingData]);
      } else if (approvedRes.ok) {
        const data = await approvedRes.json();
        setAppointments(data);
      } else if (pendingRes.ok) {
        const data = await pendingRes.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  const validateStep1 = () => {
    return selectedResearchType && selectedDefenseType && selectedDate && selectedRoom && selectedTime;
  };

  const validateStep2 = () => {
    return groupCode && researchTitle && adviserName && 
           teamMembers.filter(member => member.name.trim()).length > 0;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const trackingNum = generateTrackingNumber();
      setTrackingNumber(trackingNum);

      // Convert selected time to dateTime format expected by API
      const timeToHourMap: { [key: string]: number } = {
        "08:00 AM - 10:00 AM": 8,
        "10:00 AM - 12:00 PM": 10,
        "01:00 PM - 03:00 PM": 13,
        "03:00 PM - 05:00 PM": 15
      };
      
      const hour = timeToHourMap[selectedTime];
      if (hour === undefined) {
        throw new Error('Invalid time slot selected');
      }
      
      // Create dateTime string for the selected date and hour
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hour, 0, 0, 0);
      
      const appointmentData = {
        trackingNumber: trackingNum,
        groupCode: groupCode.toUpperCase(),
        researchType: selectedResearchType,
        defenseType: selectedDefenseType,
        researchTitle: researchTitle.toUpperCase(),
        adviserName: adviserName.toUpperCase(),
        acadYear: new Date(selectedDate).getFullYear().toString(), // Extract year from selected date
        dateTime: dateTime.toISOString(),
        timeDesc: selectedTime,
        roomName: selectedRoom,
        students: teamMembers.filter(member => member.name.trim()).map(member => ({
            student_id: member.studentId.toUpperCase(),
            name: member.name.toUpperCase(),
            course_section: member.courseSection.toUpperCase(),
            role: member.role
        })),
        members: teamMembers.filter(member => member.name.trim()).map(member => ({
            student_id: member.studentId.toUpperCase(),
            name: member.name.toUpperCase(),
            course_section: member.courseSection.toUpperCase(),
            role: member.role
        }))
      };

      console.log('Submitting appointment data:', appointmentData);
      
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        setCurrentStep(3);
      } else {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Failed to submit appointment: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      alert(`Error submitting appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Schedule Your Defense</h1>
                <p className="text-gray-600 text-lg">Follow the steps to book your defense appointment</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <span className={`ml-3 text-sm font-medium ${
                    currentStep >= step ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Select Schedule' : step === 2 ? 'Enter Details' : 'Confirmation'}
                  </span>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-4 ${
                      currentStep > step ? 'bg-orange-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Dynamic Selection */}
          {currentStep === 1 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  Step 1: Select Defense Type and Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Research Type Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">Select Research Type *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["CAPSTONE", "THESIS"].map((type) => (
                      <div
                        key={type}
                        onClick={() => setSelectedResearchType(type)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedResearchType === type
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedResearchType === type ? 'bg-orange-100' : 'bg-gray-100'
                          }`}>
                            <FileText className={`h-5 w-5 ${
                              selectedResearchType === type ? 'text-orange-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">{type}</span>
                            <p className="text-xs text-gray-500">
                              {type === "CAPSTONE" ? "Project-based defense" : "Thesis defense"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defense Type Selection */}
                {selectedResearchType && (
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">Select Defense Type *</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {["PROPOSAL", "FINAL"].map((type) => (
                        <div
                          key={type}
                          onClick={() => setSelectedDefenseType(type)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedDefenseType === type
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedDefenseType === type ? 'bg-orange-100' : 'bg-gray-100'
                            }`}>
                              <AlertCircle className={`h-5 w-5 ${
                                selectedDefenseType === type ? 'text-orange-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{type}</span>
                              <p className="text-xs text-gray-500">
                                {type === "PROPOSAL" ? "Initial proposal defense" : "Final defense presentation"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Dates */}
                {selectedResearchType && selectedDefenseType && availableDates.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      Available Defense Dates ({availableDates.length})
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableDates.map((date) => (
                        <div
                          key={date.date}
                          onClick={() => setSelectedDate(date.date)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedDate === date.date
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{date.label}</span>
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                              {date.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Rooms */}
                {selectedDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      All Rooms ({rooms.length})
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rooms.map((room) => (
                        <div
                          key={room}
                          onClick={() => setSelectedRoom(room)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedRoom === room
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

                {/* Available Time Slots */}
                {selectedRoom && availableTimeSlots.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      Available Time Slots ({availableTimeSlots.length})
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableTimeSlots.map((slot) => (
                        <div
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedTime === slot
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-900">{slot}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Availability Message */}
                {selectedResearchType && selectedDefenseType && 
                 ((selectedDate && availableRooms.length === 0) || 
                  (selectedRoom && availableTimeSlots.length === 0)) && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800 font-medium">
                        No available slots found for the selected options. Please try different selections.
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button 
                    onClick={nextStep}
                    disabled={!validateStep1()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Next Step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Information Input */}
          {currentStep === 2 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  Step 2: Enter Defense Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">Group Code *</Label>
                  <Input
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                    placeholder="Enter group code"
                    className="h-12"
                  />
                </div>

                {/* Display Selected Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Label className="text-xs font-medium text-orange-600 mb-1 block">Research Type</Label>
                    <p className="font-semibold text-gray-900">{selectedResearchType}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Label className="text-xs font-medium text-orange-600 mb-1 block">Defense Type</Label>
                    <p className="font-semibold text-gray-900">{selectedDefenseType}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">Research Title *</Label>
                  <Input
                    value={researchTitle}
                    onChange={(e) => setResearchTitle(e.target.value.toUpperCase())}
                    placeholder="Enter research title"
                    className="h-12"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">Adviser Name *</Label>
                  <Input
                    value={adviserName}
                    onChange={(e) => setAdviserName(e.target.value.toUpperCase())}
                    placeholder="Enter adviser name"
                    className="h-12"
                  />
                </div>

                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-900">Team Members *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTeamMember}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Member
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value.toUpperCase())}
                            placeholder={`Team member ${index + 1} name`}
                            className="h-12 flex-1"
                          />
                          {teamMembers.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeTeamMember(index)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input
                            value={member.studentId}
                            onChange={(e) => updateTeamMember(index, 'studentId', e.target.value.toUpperCase())}
                            placeholder={`Student ID (e.g., 221-2223)`}
                            className="h-12"
                          />
                          <Input
                            value={member.courseSection}
                            onChange={(e) => updateTeamMember(index, 'courseSection', e.target.value.toUpperCase())}
                            placeholder={`Course-Section (e.g., BSIT-3A)`}
                            className="h-12"
                          />
                          <select
                            value={member.role}
                            onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                            className="h-12"
                          >
                            <option value="TEAM LEADER">TEAM LEADER</option>
                            <option value="MEMBER">MEMBER</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    Previous Step
                  </Button>
                  <Button 
                    onClick={nextStep}
                    disabled={!validateStep2() || isSubmitting}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit & Generate Tracking'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  Successfully Booked!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Defense Schedule Confirmed</h3>
                  <p className="text-gray-600 mb-6">Your defense has been scheduled and is now waiting for approval.</p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6">
                  <div className="text-center">
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Tracking Number</Label>
                    <div className="text-3xl font-bold text-orange-600 mb-2">{trackingNumber}</div>
                    <p className="text-sm text-gray-600">Save this number to track your appointment status</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Schedule Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{selectedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room:</span>
                        <span className="font-medium">{selectedRoom}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Defense Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group Code:</span>
                        <span className="font-medium">{groupCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedResearchType} - {selectedDefenseType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-yellow-600">Pending Approval</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Link href="/track">
                    <Button variant="outline">
                      Track Appointment
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
