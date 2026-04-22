import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get all users as potential advisers
    const { data: advisers, error } = await supabase
      .from('users')
      .select('id, fullname, username')
      .order('fullname', { ascending: true });

    if (error) {
      console.error('Get advisers error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch advisers' },
        { status: 500 }
      );
    }

    // Map to expected format
    const mappedAdvisers = advisers?.map(user => ({
      id: user.id,
      name: user.fullname || user.username,
      username: user.username
    })) || [];

    return NextResponse.json(mappedAdvisers);
  } catch (error) {
    console.error('Get advisers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advisers' },
      { status: 500 }
    );
  }
}
