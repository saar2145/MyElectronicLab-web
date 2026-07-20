// Version: 1.0
// Title: Admin Overview API Route | Important Data: single GET that returns
// counts for the dashboard home cards (open tickets, pending mentors, total
// users, total products) - avoids the dashboard firing 4 separate requests on
// load. Uses head:true count-only queries (no row data transferred).

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value;
  return verifySessionToken(token);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'אין הרשאה. יש להתחבר מחדש.' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();

  const [openTickets, pendingMentors, totalUsers, totalProducts] = await Promise.all([
    supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'פתוח'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mentor').eq('mentor_approved', false),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('row_type', 'product'),
  ]);

  return NextResponse.json({
    openTickets: openTickets.count ?? 0,
    pendingMentors: pendingMentors.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    totalProducts: totalProducts.count ?? 0,
  });
}
