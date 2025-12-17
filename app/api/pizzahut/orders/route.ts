import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      orderNumber,
      items,
      table,
      floor,
      specialInstructions,
      total,
    } = body;

    // Create order record
    const orderData = {
      order_number: orderNumber,
      restaurant_type: 'pizzahut',
      status: 'pending',
      table_number: table || null,
      floor: floor || null,
      special_instructions: specialInstructions || null,
      total_amount: total,
      items: JSON.stringify(items),
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    
    // If no Supabase, return demo mode response
    if (!supabase) {
      return NextResponse.json({
        success: true,
        orderNumber,
        message: 'Order received (demo mode - no database)',
        order: orderData,
      });
    }

    // Try to insert into database
    const { data, error } = await supabase
      .from('demo_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Return success anyway for demo purposes (table might not exist)
      return NextResponse.json({
        success: true,
        orderNumber,
        message: 'Order received (demo mode)',
        order: orderData,
      });
    }

    return NextResponse.json({
      success: true,
      orderNumber,
      order: data,
    });

  } catch (error) {
    console.error('Order submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({ orders: [], message: 'No database configured' });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('demo_orders')
      .select('*')
      .eq('restaurant_type', 'pizzahut')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ orders: [], error: error.message });
    }

    // Parse items JSON for each order
    const orders = (data || []).map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
    }));

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ orders: [], error: 'Failed to fetch orders' });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No database configured' },
        { status: 503 }
      );
    }
    
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or status' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('demo_orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'No database configured' },
        { status: 503 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing order id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('demo_orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
