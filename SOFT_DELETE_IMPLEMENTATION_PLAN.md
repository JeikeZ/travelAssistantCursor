# Soft Delete for Packing List Items - Implementation Plan

## Overview

This plan details the implementation of a soft delete feature for packing list items. When users delete items from their packing lists, the items will be marked as deleted rather than being permanently removed from the database. This preserves data integrity and allows for potential future features like undo, restore, or analytics.

## Current State Analysis

### Existing Delete Functionality

**Current Behavior:**
- Items can only be deleted if `item.custom === true` (see `PackingItemComponent.tsx` line 74)
- Delete performs a hard delete via `DELETE /api/trips/[id]/items/[itemId]`
- Hard delete permanently removes records from the `packing_items` table
- Completion percentage is recalculated after deletion

**Current Delete Flow:**
1. User clicks delete button (trash icon) on a custom item
2. `PackingItemComponent` calls `onDelete(itemId)`
3. On packing list page: API call to `DELETE /api/trips/[id]/items/[itemId]`
4. API endpoint deletes row from database using `.delete()`
5. Trip's updated_at and completion_percentage are recalculated
6. UI updates to remove item from list

### Database Schema (Current)

```sql
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('clothing', 'toiletries', 'electronics', 'travel_documents', 'medication', 'miscellaneous')),
  essential BOOLEAN DEFAULT false,
  packed BOOLEAN DEFAULT false,
  custom BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);
```

**Missing:** `deleted_at` column for soft delete tracking

### TypeScript Types (Current)

```typescript
export interface PackingItemDb {
  id: string
  trip_id: string
  name: string
  category: PackingCategory
  essential: boolean
  packed: boolean
  custom: boolean
  quantity: number
  created_at: string
  updated_at: string
  notes: string | null
}
```

**Missing:** `deleted_at` field

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Add deleted_at Column

**SQL Migration Script:**
```sql
-- Add deleted_at column to packing_items table
ALTER TABLE packing_items 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient filtering of non-deleted items
CREATE INDEX idx_packing_items_deleted_at ON packing_items(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN packing_items.deleted_at IS 
'Timestamp when item was soft-deleted. NULL means item is not deleted.';
```

**Reasoning:**
- `TIMESTAMPTZ` allows us to track when deletion occurred
- `DEFAULT NULL` means existing and new items are not deleted by default
- NULL value indicates item is active (not deleted)
- Non-NULL value indicates item is soft-deleted
- Partial index improves query performance for active items
- Index only includes rows where `deleted_at IS NULL` (active items)

**Execution:**
- Run this SQL in Supabase SQL Editor
- Or add to migration file if using migrations

---

### Phase 2: TypeScript Type Updates

#### 2.1 Update PackingItemDb Interface

**File:** `src/types/index.ts`

**Changes:**
```typescript
export interface PackingItemDb {
  id: string
  trip_id: string
  name: string
  category: PackingCategory
  essential: boolean
  packed: boolean
  custom: boolean
  quantity: number
  created_at: string
  updated_at: string
  notes: string | null
  deleted_at: string | null  // NEW: Timestamp of soft deletion
}
```

#### 2.2 Update Insert and Update Types

**No changes needed for:**
- `PackingItemInsert` - `deleted_at` should not be set on insert (always NULL)
- `PackingItemUpdate` - We'll never update `deleted_at` via PUT, only via DELETE

#### 2.3 Update UpdatePackingItemRequest (if needed)

**File:** `src/types/index.ts`

The `UpdatePackingItemRequest` interface doesn't need `deleted_at` since soft delete is handled by the DELETE endpoint.

---

### Phase 3: API Endpoint Updates

#### 3.1 Update GET Endpoints to Filter Deleted Items

**Files to Update:**
- `src/app/api/trips/[id]/items/route.ts` (GET method)
- `src/app/api/trips/[id]/route.ts` (GET method)

**Current Code (GET /api/trips/[id]/items):**
```typescript
const { data: items, error } = await supabaseServer
  .from('packing_items')
  .select('*')
  .eq('trip_id', tripId)
  .order('category', { ascending: true })
  .order('name', { ascending: true })
```

**Updated Code:**
```typescript
const { data: items, error } = await supabaseServer
  .from('packing_items')
  .select('*')
  .eq('trip_id', tripId)
  .is('deleted_at', null)  // NEW: Only fetch non-deleted items
  .order('category', { ascending: true })
  .order('name', { ascending: true })
```

**Apply to:**
1. `GET /api/trips/[id]/items` - Line ~148-154
2. `GET /api/trips/[id]` - Line ~79 (when fetching packing items)
3. All other queries that fetch packing items

---

#### 3.2 Update DELETE Endpoint to Soft Delete

**File:** `src/app/api/trips/[id]/items/[itemId]/route.ts`

**Current Code (DELETE method):**
```typescript
// Delete item
const { error } = await supabaseServer
  .from('packing_items')
  .delete()
  .eq('id', itemId)
  .eq('trip_id', tripId)
```

**Updated Code:**
```typescript
// Soft delete item by setting deleted_at timestamp
const { error } = await supabaseServer
  .from('packing_items')
  .update({ 
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as never)
  .eq('id', itemId)
  .eq('trip_id', tripId)
```

**Key Changes:**
- Replace `.delete()` with `.update()`
- Set `deleted_at` to current timestamp
- Also update `updated_at` for consistency
- Keep the same security checks (trip ownership)

---

#### 3.3 Update Completion Percentage Calculations

**Files to Update:**
- `src/app/api/trips/[id]/items/[itemId]/route.ts` (PUT and DELETE methods)
- `src/app/api/trips/[id]/route.ts` (GET method)

**Current Code (Completion Calculation in DELETE):**
```typescript
// Recalculate completion percentage
const { data: allItems } = await supabaseServer
  .from('packing_items')
  .select('packed')
  .eq('trip_id', tripId)
```

**Updated Code:**
```typescript
// Recalculate completion percentage (exclude deleted items)
const { data: allItems } = await supabaseServer
  .from('packing_items')
  .select('packed')
  .eq('trip_id', tripId)
  .is('deleted_at', null)  // NEW: Exclude soft-deleted items
```

**Apply to:**
1. DELETE endpoint - After soft delete operation
2. PUT endpoint - When packed status changes
3. GET trip detail endpoint - When calculating statistics

---

### Phase 4: Frontend Updates

#### 4.1 Update usePackingList Hook

**File:** `src/hooks/usePackingList.ts`

**Current Behavior:**
- Hook filters items out of local array using `.filter()`
- This is fine for localStorage-based lists (guest users)

**For Guest Users (No Database):**
- Keep current behavior (hard delete from localStorage)
- Guest users don't have persistent storage, so no need for soft delete

**For Authenticated Users (Database):**
- Soft delete is handled by API endpoint
- Frontend just needs to remove from UI after successful API call
- No changes needed to the hook itself

**Conclusion:** No changes required to `usePackingList.ts` - it already uses the API endpoints correctly.

---

#### 4.2 Update Packing List Page

**File:** `src/app/packing-list/page.tsx`

**Current Behavior:**
- Delete button only shows for custom items (`item.custom && ...`)
- Lines 74-92 in `PackingItemComponent`

**Proposed Change:**
Allow deletion of ALL items, not just custom ones.

**Reasoning:**
- User requirement: "users should be able to delete items from the packing list they generate"
- "Generate" implies AI-generated items (custom=false) should also be deletable
- Users should have full control over their packing lists

**Implementation:**

**Option 1: Remove custom check entirely**
```typescript
// In PackingItemComponent.tsx
<div className="flex space-x-1">
  {/* Remove the 'if (item.custom)' wrapper */}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onStartEdit(item.id)}
  >
    <Edit3 className="w-4 h-4" />
  </Button>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onDelete(item.id)}
    className="text-red-600 hover:text-red-700"
  >
    <Trash2 className="w-4 h-4" />
  </Button>
</div>
```

**Option 2: Keep edit for custom only, allow delete for all**
```typescript
<div className="flex space-x-1">
  {item.custom && (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onStartEdit(item.id)}
    >
      <Edit3 className="w-4 h-4" />
    </Button>
  )}
  {/* Delete available for ALL items */}
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onDelete(item.id)}
    className="text-red-600 hover:text-red-700"
  >
    <Trash2 className="w-4 h-4" />
  </Button>
</div>
```

**Recommendation:** Option 2 - Keep edit restricted to custom items (makes sense), but allow delete for all items.

---

#### 4.3 Update Trip Detail Page

**File:** `src/app/trips/[id]/page.tsx`

**Current Behavior:**
- Uses `PackingItemComponent` with same delete logic
- Lines 74-92 in component restrict delete to custom items only

**Required Changes:**
- Same as 4.2 above - allow delete for all items
- Delete confirmation dialog already exists (line 52)
- No additional changes needed beyond component update

---

### Phase 5: Additional Considerations

#### 5.1 Database Cleanup (Future Enhancement)

**Optional:** Add a scheduled job to permanently delete soft-deleted items after a retention period (e.g., 30-90 days).

**Implementation (Future):**
```sql
-- Delete items soft-deleted more than 90 days ago
DELETE FROM packing_items 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '90 days';
```

This could be implemented as:
- Supabase Edge Function with cron trigger
- External scheduled job
- Manual cleanup script

#### 5.2 Undo/Restore Feature (Future Enhancement)

With soft delete in place, future features could include:
- "Undo" button after deletion (restore within 5 minutes)
- "View Deleted Items" section in trip detail
- Bulk restore functionality

**Restore Endpoint (Future):**
```typescript
// PATCH /api/trips/[id]/items/[itemId]/restore
const { error } = await supabaseServer
  .from('packing_items')
  .update({ 
    deleted_at: null,
    updated_at: new Date().toISOString()
  } as never)
  .eq('id', itemId)
  .eq('trip_id', tripId)
```

#### 5.3 Analytics (Future Enhancement)

Soft delete enables analytics:
- Which items users most commonly delete
- AI-generated items that users don't need
- Improve packing list generation based on deletion patterns

---

## Implementation Checklist

### Database Changes
- [ ] Run migration to add `deleted_at` column
- [ ] Create index on `deleted_at`
- [ ] Verify column exists in Supabase dashboard
- [ ] Test query performance with index

### Type Updates
- [ ] Update `PackingItemDb` interface
- [ ] Verify TypeScript compilation succeeds
- [ ] Update any type guards if needed

### API Endpoints
- [ ] Update GET /api/trips/[id]/items to filter deleted items
- [ ] Update GET /api/trips/[id] to filter deleted items
- [ ] Update DELETE /api/trips/[id]/items/[itemId] to soft delete
- [ ] Update completion percentage calculation in DELETE endpoint
- [ ] Update completion percentage calculation in PUT endpoint
- [ ] Update completion percentage calculation in GET endpoint
- [ ] Test all API endpoints

### Frontend Components
- [ ] Update PackingItemComponent to allow delete for all items
- [ ] Test delete functionality in initial packing list page
- [ ] Test delete functionality in trip detail page
- [ ] Verify completion progress updates correctly
- [ ] Test with both guest and authenticated users

### Testing
- [ ] Create test trip with items
- [ ] Delete AI-generated items (custom=false)
- [ ] Delete user-added items (custom=true)
- [ ] Verify items disappear from UI
- [ ] Check database to confirm soft delete (deleted_at is set)
- [ ] Verify completion percentage updates correctly
- [ ] Test on both /packing-list and /trips/[id] pages
- [ ] Test as guest user (should use localStorage)
- [ ] Test as authenticated user (should use database)

---

## Rollback Plan

If issues arise, rollback steps:

1. **Revert API Endpoints:**
   - Change soft delete back to hard delete
   - Remove `.is('deleted_at', null)` filters
   
2. **Revert Component Changes:**
   - Restore `item.custom` check for delete button

3. **Database Rollback (if needed):**
   ```sql
   -- Remove the column (if necessary)
   ALTER TABLE packing_items DROP COLUMN IF EXISTS deleted_at;
   
   -- Drop the index
   DROP INDEX IF EXISTS idx_packing_items_deleted_at;
   ```

---

## Testing Scenarios

### Scenario 1: Initial Packing List (Authenticated User)
1. Login as registered user
2. Create new trip
3. Generate packing list
4. Delete an AI-generated item (custom=false)
5. Delete a user-added item (custom=true)
6. Verify items removed from UI
7. Verify completion percentage updates
8. Check database: items should have deleted_at timestamp
9. Navigate away and back - deleted items should not reappear

### Scenario 2: Trip Detail Page
1. Login as registered user
2. Open existing trip from "My Trips"
3. Delete multiple items from packing list
4. Verify progress bar updates
5. Refresh page - deleted items should not reappear
6. Check statistics - should exclude deleted items

### Scenario 3: Guest User (localStorage)
1. Use app without logging in
2. Generate packing list
3. Delete items
4. Items should be removed from localStorage
5. No database operations should occur

### Scenario 4: Edge Cases
1. Delete all items from a trip
   - Completion percentage should go to 0%
   - No errors should occur
2. Delete items, then add new items
   - New items should appear normally
   - Deleted items should stay deleted
3. Duplicate trip with deleted items
   - Deleted items should NOT be copied to new trip

---

## Security Considerations

1. **Authorization:** Delete endpoint already checks trip ownership - maintain this
2. **RLS Policies:** If using Row Level Security, soft delete works with existing policies
3. **Audit Trail:** `deleted_at` timestamp provides audit trail for compliance
4. **Data Retention:** Consider implementing automatic cleanup after retention period

---

## Performance Considerations

1. **Index on deleted_at:** Partial index improves query performance
2. **Query Filtering:** Adding `.is('deleted_at', null)` is efficient with index
3. **Database Growth:** Soft deleted items accumulate over time
   - Monitor table size
   - Implement cleanup strategy if needed
4. **Existing Trips:** No migration needed - existing items have NULL deleted_at (active)

---

## Documentation Updates

After implementation, update:
- [ ] API documentation with soft delete behavior
- [ ] User guide explaining delete functionality
- [ ] Database schema documentation
- [ ] Developer documentation with soft delete approach

---

## Summary

This soft delete implementation:
✅ Preserves data for potential restore/undo features
✅ Maintains audit trail of deletions
✅ Enables future analytics on deleted items
✅ Minimal changes to existing code
✅ Backward compatible (existing items remain active)
✅ Works with both guest (localStorage) and authenticated users
✅ Allows deletion of both AI-generated and user-added items
✅ Updates completion percentages correctly
✅ Maintains security through existing authorization checks

The implementation is straightforward and follows best practices for soft delete patterns in modern applications.
