import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo purposes (will reset on server restart)
// In production, use Supabase or another database
let orders: any[] = [];

export async function GET() {
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newOrder = {
      id: crypto.randomUUID(),
      order_id: body.order_id,
      items: body.items,
      table_no: body.table_no,
      floor: body.floor,
      total: body.total,
      status: body.status || 'pending',
      created_at: new Date().toISOString(),
    };
    
    orders.unshift(newOrder);
    
    // Keep only last 50 orders
    if (orders.length > 50) {
      orders = orders.slice(0, 50);
    }
    
    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status } = body;
    
    const orderIndex = orders.findIndex(o => o.order_id === order_id);
    if (orderIndex >= 0) {
      orders[orderIndex].status = status;
      return NextResponse.json({ success: true, order: orders[orderIndex] });
    }
    
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    
    if (orderId) {
      orders = orders.filter(o => o.order_id !== orderId);
      return NextResponse.json({ success: true });
    }
    
    // Clear all orders if no ID specified
    orders = [];
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
