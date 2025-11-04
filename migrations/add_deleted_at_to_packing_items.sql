-- Migration: Add soft delete support to packing_items table
-- Description: Adds deleted_at column and index for soft delete functionality
-- Date: 2025-11-04

-- Add deleted_at column to packing_items table
ALTER TABLE packing_items 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for efficient filtering of non-deleted items
-- This partial index only includes rows where deleted_at IS NULL (active items)
CREATE INDEX idx_packing_items_deleted_at ON packing_items(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN packing_items.deleted_at IS 
'Timestamp when item was soft-deleted. NULL means item is not deleted.';

-- Verify migration
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'packing_items' 
-- AND column_name = 'deleted_at';
