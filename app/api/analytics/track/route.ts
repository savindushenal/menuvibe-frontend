import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// POST /api/analytics/track - Track user interactions (scans, views, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      event_type, // 'qr_scan', 'menu_view', 'item_view', 'order_placed'
      menu_id, 
      item_id, 
      qr_code_id,
      table_number,
      user_agent,
      ip_address,
      referrer,
      session_id,
      additional_data
    } = body;

    // Get client IP from headers
    const clientIp = request.headers.get('x-forwarded-for') 
      || request.headers.get('x-real-ip') 
      || ip_address 
      || 'unknown';

    // Get user agent
    const clientUserAgent = request.headers.get('user-agent') || user_agent || 'unknown';

    // Insert analytics event
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO analytics_events 
       (event_type, menu_id, item_id, qr_code_id, table_number, ip_address, user_agent, referrer, session_id, additional_data, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        event_type,
        menu_id || null,
        item_id || null,
        qr_code_id || null,
        table_number || null,
        clientIp,
        clientUserAgent,
        referrer || null,
        session_id || null,
        additional_data ? JSON.stringify(additional_data) : null
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      data: { event_id: result.insertId }
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to track event' },
      { status: 500 }
    );
  }
}