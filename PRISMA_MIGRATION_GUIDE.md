# Prisma ORM Migration Guide for MenuVibe

## ✅ Completed Setup Steps

1. **Installed Prisma** - `@prisma/client` and `prisma` packages
2. **Initialized Prisma** - Created `prisma/schema.prisma` with MySQL provider
3. **Database Introspection** - Pulled existing database schema (15 models)
4. **Generated Client** - Created type-safe Prisma Client at `lib/generated/prisma`
5. **Created Prisma Singleton** - `lib/prisma.ts` for Next.js best practices
6. **Added Scripts** - package.json includes prisma commands

## 📋 Migration Pattern

### Before (Raw SQL with mysql2):
\`\`\`typescript
import { query, queryOne } from '@/lib/db';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// SELECT query
const users = await query<User>('SELECT * FROM users WHERE email = ?', [email]);
const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);

// INSERT query
const [result] = await pool.execute<ResultSetHeader>(
  'INSERT INTO menus (name, location_id) VALUES (?, ?)',
  [name, locationId]
);
const newId = result.insertId;

// UPDATE query
await query('UPDATE users SET name = ? WHERE id = ?', [name, id]);

// DELETE query
await query('DELETE FROM menus WHERE id = ?', [menuId]);
\`\`\`

### After (Prisma ORM):
\`\`\`typescript
import prisma from '@/lib/prisma';

// SELECT query (findMany / findUnique / findFirst)
const users = await prisma.users.findMany({ where: { email } });
const user = await prisma.users.findUnique({ where: { id } });

// INSERT query (create)
const menu = await prisma.menus.create({
  data: {
    name,
    location_id: locationId,
  },
});
const newId = menu.id;

// UPDATE query (update / updateMany)
await prisma.users.update({
  where: { id },
  data: { name },
});

// DELETE query (delete / deleteMany)
await prisma.menus.delete({ where: { id: menuId } });
\`\`\`

## 🔄 Common Conversions

### 1. Find One Record
\`\`\`typescript
// Before
const location = await queryOne<any>(
  'SELECT * FROM locations WHERE id = ? AND user_id = ?',
  [locationId, userId]
);

// After
const location = await prisma.locations.findFirst({
  where: {
    id: BigInt(locationId),
    user_id: BigInt(userId),
  },
});
\`\`\`

### 2. Find with Relations (JOINs)
\`\`\`typescript
// Before
const menus = await query<any>(
  \`SELECT m.*, 
    (SELECT JSON_ARRAYAGG(...) FROM menu_items mi WHERE mi.menu_id = m.id) as items
   FROM menus m WHERE m.location_id = ?\`,
  [locationId]
);

// After
const menus = await prisma.menus.findMany({
  where: { location_id: BigInt(locationId) },
  include: {
    menu_items: true,
    menu_categories: true,
  },
  orderBy: [
    { sort_order: 'asc' },
    { created_at: 'desc' },
  ],
});
\`\`\`

### 3. Create with Relations
\`\`\`typescript
// Before
const [result] = await pool.execute<ResultSetHeader>(
  'INSERT INTO menus (location_id, name, slug) VALUES (?, ?, ?)',
  [locationId, name, slug]
);

// After
const menu = await prisma.menus.create({
  data: {
    name,
    slug,
    locations: {
      connect: { id: BigInt(locationId) },
    },
  },
});
\`\`\`

### 4. Update Multiple Records
\`\`\`typescript
// Before
await query(
  'UPDATE locations SET is_default = 0 WHERE user_id = ?',
  [userId]
);

// After
await prisma.locations.updateMany({
  where: { user_id: BigInt(userId) },
  data: { is_default: false },
});
\`\`\`

### 5. Count Records
\`\`\`typescript
// Before
const [result] = await query<any>(
  'SELECT COUNT(*) as count FROM menus WHERE location_id = ?',
  [locationId]
);
const count = result.count;

// After
const count = await prisma.menus.count({
  where: { location_id: BigInt(locationId) },
});
\`\`\`

### 6. Conditional Queries
\`\`\`typescript
// Before
let sql = 'SELECT * FROM menus WHERE 1=1';
const params = [];
if (locationId) {
  sql += ' AND location_id = ?';
  params.push(locationId);
}

// After
const menus = await prisma.menus.findMany({
  where: {
    ...(locationId && { location_id: BigInt(locationId) }),
  },
});
\`\`\`

## ⚠️ Important Notes

### BigInt Handling
Prisma uses `BigInt` for MySQL BIGINT columns. You'll need to convert:
\`\`\`typescript
// For input parameters
const id = BigInt(userId);

// For output (if needed for JSON)
const idAsString = menu.id.toString();
\`\`\`

### JSON Fields
Fields stored as JSON in MySQL are automatically parsed by Prisma:
\`\`\`typescript
// Before
const hours = menu.operating_hours ? JSON.parse(menu.operating_hours) : null;

// After
const hours = menu.operating_hours; // Already parsed!
\`\`\`

### Timestamps
Prisma automatically handles timestamps:
\`\`\`typescript
// Before
created_at: 'NOW()'

// After - Prisma handles this automatically with @default(now())
\`\`\`

### Transactions
\`\`\`typescript
// Before
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  await connection.execute(...);
  await connection.execute(...);
  await connection.commit();
} catch (error) {
  await connection.rollback();
}

// After
await prisma.$transaction(async (tx) => {
  await tx.users.update(...);
  await tx.locations.create(...);
});
\`\`\`

## 📂 Files to Migrate

### Priority 1 - Authentication
- [ ] `app/api/auth/login/route.ts`
- [ ] `app/api/auth/register/route.ts`
- [ ] `app/api/auth/google/callback/route.ts`
- [ ] `app/api/user/route.ts`

### Priority 2 - Core Features
- [ ] `app/api/locations/route.ts`
- [ ] `app/api/locations/[id]/route.ts`
- [ ] `app/api/menus/route.ts`
- [ ] `app/api/menus/[id]/route.ts`

### Priority 3 - Menu Management
- [ ] `app/api/menus/[id]/categories/route.ts`
- [ ] `app/api/menus/[id]/items/route.ts`
- [ ] `app/api/menus/[id]/items/[itemId]/route.ts`

### Priority 4 - Subscription & Settings
- [ ] `app/api/subscriptions/current/route.ts`
- [ ] `app/api/subscriptions/plans/route.ts`
- [ ] `app/api/settings/route.ts`

### Priority 5 - QR & Analytics
- [ ] `app/api/qr-codes/route.ts`
- [ ] `app/api/analytics/track/route.ts`
- [ ] `app/api/analytics/stats/route.ts`

## 🚀 Next Steps

1. Test each migrated route thoroughly
2. Remove old `lib/db.old.ts` when complete
3. Run `npm run prisma:studio` to visually explore your database
4. Consider using `prisma migrate` for future schema changes

## 📚 Resources

- [Prisma Client API Docs](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-best-practices)
- [Next.js with Prisma](https://www.prisma.io/docs/guides/getting-started/next-js)
