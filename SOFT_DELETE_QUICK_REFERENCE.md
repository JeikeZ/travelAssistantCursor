# Soft Delete Implementation - Quick Reference

## What's Changing

Users will be able to delete ANY item from their packing lists (not just custom items). Deleted items will be soft-deleted (marked as deleted in database) rather than permanently removed.

---

## Database Changes

### SQL to Run in Supabase

```sql
-- Add deleted_at column
ALTER TABLE packing_items 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for performance
CREATE INDEX idx_packing_items_deleted_at ON packing_items(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON COLUMN packing_items.deleted_at IS 
'Timestamp when item was soft-deleted. NULL means item is not deleted.';
```

---

## TypeScript Changes

### File: `src/types/index.ts`

```typescript
export interface PackingItemDb {
  // ... existing fields ...
  deleted_at: string | null  // ADD THIS LINE
}
```

---

## API Endpoint Changes

### 1. Filter Out Deleted Items (GET Requests)

**Files:**
- `src/app/api/trips/[id]/items/route.ts` (GET)
- `src/app/api/trips/[id]/route.ts` (GET)

**Add `.is('deleted_at', null)` to all packing_items queries:**

```typescript
// BEFORE
const { data: items } = await supabaseServer
  .from('packing_items')
  .select('*')
  .eq('trip_id', tripId)

// AFTER
const { data: items } = await supabaseServer
  .from('packing_items')
  .select('*')
  .eq('trip_id', tripId)
  .is('deleted_at', null)  // ADD THIS
```

### 2. Change Hard Delete to Soft Delete

**File:** `src/app/api/trips/[id]/items/[itemId]/route.ts` (DELETE method)

```typescript
// BEFORE
const { error } = await supabaseServer
  .from('packing_items')
  .delete()
  .eq('id', itemId)
  .eq('trip_id', tripId)

// AFTER
const { error } = await supabaseServer
  .from('packing_items')
  .update({ 
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as never)
  .eq('id', itemId)
  .eq('trip_id', tripId)
```

### 3. Update Completion Percentage Calculations

**Files:**
- `src/app/api/trips/[id]/items/[itemId]/route.ts` (PUT and DELETE methods)

**Add `.is('deleted_at', null)` when fetching items for percentage calculation:**

```typescript
// BEFORE
const { data: allItems } = await supabaseServer
  .from('packing_items')
  .select('packed')
  .eq('trip_id', tripId)

// AFTER
const { data: allItems } = await supabaseServer
  .from('packing_items')
  .select('packed')
  .eq('trip_id', tripId)
  .is('deleted_at', null)  // ADD THIS
```

---

## Frontend Changes

### File: `src/components/packing/PackingItemComponent.tsx`

**Change delete button visibility from custom-only to all items:**

```typescript
// BEFORE (lines 74-92)
<div className="flex space-x-1">
  {item.custom && (
    <>
      <Button variant="ghost" size="sm" onClick={() => onStartEdit(item.id)}>
        <Edit3 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} 
              className="text-red-600 hover:text-red-700">
        <Trash2 className="w-4 h-4" />
      </Button>
    </>
  )}
</div>

// AFTER
<div className="flex space-x-1">
  {item.custom && (
    <Button variant="ghost" size="sm" onClick={() => onStartEdit(item.id)}>
      <Edit3 className="w-4 h-4" />
    </Button>
  )}
  {/* Delete button now available for ALL items, not just custom */}
  <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} 
          className="text-red-600 hover:text-red-700">
    <Trash2 className="w-4 h-4" />
  </Button>
</div>
```

**Key Change:** Move delete button outside the `item.custom` check, keep edit button inside.

---

## Files to Modify

1. **Database:**
   - Run SQL migration in Supabase SQL Editor

2. **TypeScript Types:**
   - `src/types/index.ts` - Add `deleted_at` field

3. **API Endpoints:**
   - `src/app/api/trips/[id]/items/route.ts` - Add filter to GET
   - `src/app/api/trips/[id]/route.ts` - Add filter to GET (packing items query)
   - `src/app/api/trips/[id]/items/[itemId]/route.ts` - Change DELETE to soft delete, add filter to completion calculations
   - `src/app/api/trips/[id]/items/[itemId]/route.ts` - Add filter to PUT method's completion calculation

4. **Components:**
   - `src/components/packing/PackingItemComponent.tsx` - Move delete button outside custom check

---

## Testing Checklist

### Quick Tests
- [ ] Delete AI-generated item (custom=false) → should work now
- [ ] Delete user-added item (custom=true) → should still work
- [ ] Check database → deleted items should have `deleted_at` timestamp
- [ ] Refresh page → deleted items should not reappear
- [ ] Completion percentage updates correctly when items deleted
- [ ] Works on both `/packing-list` and `/trips/[id]` pages

### Edge Cases
- [ ] Delete all items → completion goes to 0%, no errors
- [ ] Guest user delete → uses localStorage (no database)
- [ ] Duplicate trip → soft-deleted items not copied

---

## Quick Summary

| Aspect | Before | After |
|--------|--------|-------|
| Delete Button | Only custom items | All items |
| Delete Type | Hard delete (permanent) | Soft delete (marked) |
| Database | Row removed | `deleted_at` set |
| Data Recovery | Impossible | Possible (future feature) |
| Item Query | `SELECT * FROM packing_items` | `SELECT * WHERE deleted_at IS NULL` |

---

## Rollback (If Needed)

1. Revert frontend: Add back `item.custom` check around delete button
2. Revert API: Change `.update()` back to `.delete()`
3. Remove filters: Delete all `.is('deleted_at', null)` lines
4. Database: `ALTER TABLE packing_items DROP COLUMN deleted_at;`

---

## Why Soft Delete?

✅ **Data Preservation:** Can undo/restore deletions
✅ **Analytics:** See what users delete to improve AI
✅ **Audit Trail:** Know when items were deleted
✅ **User Experience:** Potential "undo" feature later
✅ **Compliance:** Some regulations require data retention

---

## Implementation Order

1. **Database** → Run SQL migration first
2. **Types** → Update TypeScript types
3. **API** → Update all API endpoints
4. **Frontend** → Update component
5. **Test** → Verify everything works

---

## Key Locations in Code

- **DELETE endpoint:** `src/app/api/trips/[id]/items/[itemId]/route.ts` line ~163-167
- **GET items endpoint:** `src/app/api/trips/[id]/items/route.ts` line ~148-154
- **GET trip endpoint:** `src/app/api/trips/[id]/route.ts` line ~79
- **Completion calc (DELETE):** `src/app/api/trips/[id]/items/[itemId]/route.ts` line ~184-187
- **Completion calc (PUT):** `src/app/api/trips/[id]/items/[itemId]/route.ts` line ~102-106
- **Delete button:** `src/components/packing/PackingItemComponent.tsx` line ~74-92

---

## Notes

- **Guest users:** Continue using localStorage (hard delete) - no changes needed
- **Authenticated users:** Use soft delete in database
- **Existing items:** Automatically active (deleted_at = NULL)
- **No migration needed:** Existing items work as-is
- **Edit button:** Stays restricted to custom items only (makes sense)
- **Delete button:** Now available for all items (user requirement)
