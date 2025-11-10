# Delete Campaign Button - Troubleshooting Guide

## What I Fixed

I've added **detailed error logging** to the delete campaign function. Now when you try to delete a campaign, you'll see exactly what's happening in the console.

## How to Test Delete Campaign

### **Step 1: Open Browser Console**
1. Press **F12** to open Developer Tools
2. Go to the **Console** tab

### **Step 2: Try Deleting a Campaign**
1. Go to the **Campaigns** page
2. Click the **trash icon** on any campaign card
3. Confirm the deletion in the modal

### **Step 3: Check Console for Messages**

You should see one of these messages:

#### **✅ Success**
```
🗑️ Deleting campaign: 123 My Campaign Name
✅ Campaign deleted successfully
```
Then the campaign disappears from the list.

#### **❌ Error**
```
❌ Failed to delete campaign: [ERROR MESSAGE]
Error details: [SPECIFIC ERROR]
```

## Common Issues & Solutions

### **Issue 1: "Permission denied" Error**

**Cause**: Row Level Security (RLS) policy is blocking the delete

**Solution**: Run this SQL in Supabase:
```sql
-- Check if RLS is enabled on campaigns table
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'campaigns';

-- If RLS is enabled, check the policies
SELECT * FROM pg_policies 
WHERE tablename = 'campaigns';
```

**Fix**: Ensure your RLS policy allows deletes:
```sql
-- Allow users to delete their own campaigns
CREATE POLICY "Users can delete their own campaigns"
ON campaigns FOR DELETE
USING (auth.uid() = user_id);
```

### **Issue 2: "Campaign not found" Error**

**Cause**: The campaign ID doesn't exist in the database

**Solution**: 
1. Refresh the page (F5)
2. Try deleting a different campaign
3. Check if the campaign was already deleted

### **Issue 3: Nothing Happens (Silent Failure)**

**Cause**: The delete request is failing but not showing an error

**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. If no errors, check network tab:
   - Press F12 → Network tab
   - Try deleting again
   - Look for failed requests to Supabase

### **Issue 4: "Failed to delete campaign: undefined"**

**Cause**: The error message isn't being captured properly

**Solution**: This is a bug in error handling. Try:
1. Refresh the page
2. Try deleting again
3. If still fails, check Supabase database directly

## Debug Steps

### **Step 1: Verify Campaign Exists**
```sql
-- In Supabase SQL Editor
SELECT id, name, user_id FROM campaigns 
WHERE id = [CAMPAIGN_ID];
```

### **Step 2: Check User Permissions**
```sql
-- Verify the user_id matches your auth user
SELECT auth.uid();
```

### **Step 3: Test Delete Directly**
```sql
-- Try deleting directly (be careful!)
DELETE FROM campaigns 
WHERE id = [CAMPAIGN_ID] AND user_id = auth.uid();
```

### **Step 4: Check RLS Policies**
```sql
-- View all policies on campaigns table
SELECT * FROM pg_policies 
WHERE tablename = 'campaigns';
```

## Expected Behavior

### **When Delete Works**
1. Click trash icon
2. Confirmation modal appears
3. Click "Delete" button
4. Campaign disappears from list
5. Success notification shows
6. Console shows: `✅ Campaign deleted successfully`

### **When Delete Fails**
1. Click trash icon
2. Confirmation modal appears
3. Click "Delete" button
4. Error notification shows
5. Campaign stays in list
6. Console shows error details

## Console Logging Added

The following logs are now available:

```javascript
// When starting delete
console.log('🗑️ Deleting campaign:', campaignId, campaignName);

// When successful
console.log('✅ Campaign deleted successfully');

// When failed
console.error('❌ Failed to delete campaign:', error);
console.error('Error details:', errorMessage);
```

## Next Steps

1. **Refresh the page** (F5)
2. **Try deleting a campaign**
3. **Open console (F12)** and check for messages
4. **Report the error message** you see

## If Still Not Working

Please provide:
1. The exact error message from the console
2. Your Supabase project URL
3. Whether you have RLS enabled on the campaigns table
4. The campaign ID you're trying to delete

Then I can debug further!
