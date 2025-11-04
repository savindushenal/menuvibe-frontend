import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// GET /api/menus/[id]/categories - Get all categories for a menu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify menu belongs to user
    const menu = await queryOne<any>(
      `SELECT m.* FROM menus m
       JOIN locations l ON m.location_id = l.id
       WHERE m.id = ? AND l.user_id = ?`,
      [params.id, user.id]
    );

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    // Get all categories
    const categories = await query<any>(
      'SELECT * FROM menu_categories WHERE menu_id = ? ORDER BY sort_order ASC, created_at DESC',
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/menus/[id]/categories - Create a new category
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken(request);
  if (!user) return unauthorized();

  try {
    // Verify menu belongs to user
    const menu = await queryOne<any>(
      `SELECT m.* FROM menus m
       JOIN locations l ON m.location_id = l.id
       WHERE m.id = ? AND l.user_id = ?`,
      [params.id, user.id]
    );

    if (!menu) {
      return NextResponse.json(
        { success: false, message: 'Menu not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, sort_order } = body;

    // Insert category
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO menu_categories (menu_id, name, description, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [params.id, name, description || null, sort_order || 0]
    );

    // Get created category
    const category = await queryOne<any>(
      'SELECT * FROM menu_categories WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
