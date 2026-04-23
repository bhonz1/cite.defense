import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test appointment data
    const testAppointments = [
      {
        tracking_number: 'TEST001',
        appointment_code: 'CPTEST001',
        research_title: 'Test Research: Artificial Intelligence in Healthcare',
        group_code: 'GRP001',
        student_name: 'Test Student 1',
        student_email: 'test1@example.com',
        date: '2026-05-04',
        time_desc: '08:00 AM - 10:00 AM',
        room: 'ITE102',
        status: 'PENDING',
        research_type: 'CAPSTONE',
        defense_type: 'PROPOSAL',
        adviser_name: 'Dr. Test Adviser',
        acad_year: '2024-2025'
      },
      {
        tracking_number: 'TEST002',
        appointment_code: 'CPTEST002',
        research_title: 'Test Research: Machine Learning Applications',
        group_code: 'GRP002',
        student_name: 'Test Student 2',
        student_email: 'test2@example.com',
        date: '2026-05-08',
        time_desc: '10:00 AM - 12:00 PM',
        room: 'ITE103',
        status: 'PENDING',
        research_type: 'THESIS',
        defense_type: 'FINAL',
        adviser_name: 'Dr. Test Adviser',
        acad_year: '2024-2025'
      },
      {
        tracking_number: 'TEST003',
        appointment_code: 'CPTEST003',
        research_title: 'Test Research: Blockchain Technology',
        group_code: 'GRP003',
        student_name: 'Test Student 3',
        student_email: 'test3@example.com',
        date: '2026-05-11',
        time_desc: '01:00 PM - 03:00 PM',
        room: 'LAB 1',
        status: 'PENDING',
        research_type: 'CAPSTONE',
        defense_type: 'PROPOSAL',
        adviser_name: 'Dr. Test Adviser',
        acad_year: '2025-2026'
      }
    ];

    // Insert test appointments
    const { data, error } = await supabase
      .from('appointments')
      .insert(testAppointments)
      .select();

    if (error) {
      console.error('Error inserting test appointments:', error);
      return NextResponse.json(
        { error: 'Failed to add test appointments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test appointments added successfully',
      data
    });

  } catch (error) {
    console.error('Test data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Delete test appointments (those with tracking_number starting with TEST)
    const { data, error } = await supabase
      .from('appointments')
      .delete()
      .like('tracking_number', 'TEST%')
      .select();

    if (error) {
      console.error('Error deleting test appointments:', error);
      return NextResponse.json(
        { error: 'Failed to delete test appointments', details: error.message },
        { status: 500 }
      );
    }

    // Also delete associated panelists
    const { error: panelistsError } = await supabase
      .from('panelists')
      .delete()
      .like('group_code', 'GRP%');

    if (panelistsError) {
      console.error('Error deleting test panelists:', panelistsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Test appointments deleted successfully',
      data
    });

  } catch (error) {
    console.error('Test data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
