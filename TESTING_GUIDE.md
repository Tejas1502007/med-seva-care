# 🧪 Medicine Management Testing Guide

## Test Cases

### Test 1: Add a Single Tablet Medication
**Objective:** Verify basic medicine addition with single time

**Steps:**
1. Login as patient
2. Go to **My Care Plan** → **Medications**
3. Fill form:
   - Name: "Aspirin"
   - Quantity: 1
   - Unit: "tablet"
   - Frequency: "Once daily"
   - Time: 09:00
   - Notes: (empty)
4. Click **Add Medication**

**Expected Result:**
- ✅ Toast shows "Medication added successfully"
- ✅ List shows: "Aspirin (1 tablet)"
- ✅ Displays: "Once daily • 09:00"
- ✅ Status: "Pending"
- ✅ Table shows correct values
- ✅ Database record created (verify in Supabase)

**Actual Result:** _______________

---

### Test 2: Add Medicine with Multiple Times
**Objective:** Verify medicine with multiple daily doses

**Steps:**
1. Login as patient
2. Go to **My Care Plan** → **Medications**
3. Fill form:
   - Name: "Metformin"
   - Quantity: 1
   - Unit: "tablet"
   - Frequency: "Twice daily"
   - Time 1: 08:00
   - Add another time: 20:00
   - Notes: "Take with meals"
4. Click **Add Medication**

**Expected Result:**
- ✅ Toast shows success
- ✅ Shows "Metformin (1 tablet)"
- ✅ Times display: "08:00, 20:00"
- ✅ Notes display: "📝 Take with meals"
- ✅ Both times saved in database
- ✅ Can remove a time if needed

**Actual Result:** _______________

---

### Test 3: Add Medicine with Different Units
**Objective:** Verify various unit types

**Steps:**
1. Add each medicine:

   **Medicine A:**
   - Name: "Cough Syrup"
   - Quantity: 5
   - Unit: "ml"
   - Frequency: "Thrice daily"
   - Times: 08:00, 14:00, 20:00

   **Medicine B:**
   - Name: "Vitamin"
   - Quantity: 2
   - Unit: "capsule"
   - Frequency: "Once daily"
   - Time: 09:00

   **Medicine C:**
   - Name: "Eye Drops"
   - Quantity: 2
   - Unit: "drop"
   - Frequency: "Four times daily"
   - Times: 07:00, 12:00, 17:00, 22:00

2. Verify each displays correctly

**Expected Result:**
- ✅ "Cough Syrup (5 ml)" - displays correctly
- ✅ "Vitamin (2 capsule)" - displays correctly
- ✅ "Eye Drops (2 drop)" - displays correctly
- ✅ All three medicines listed
- ✅ All times display correctly
- ✅ All saved in database

**Actual Result:** _______________

---

### Test 4: Add Medicine with Decimal Quantity
**Objective:** Verify fractional doses

**Steps:**
1. Add medicine:
   - Name: "Lisinopril"
   - Quantity: 0.5
   - Unit: "tablet"
   - Frequency: "Once daily"
   - Time: 09:00
2. Verify display and database

**Expected Result:**
- ✅ Displays as "Lisinopril (0.5 tablet)"
- ✅ Database stores quantity as 0.5
- ✅ Can mark as taken
- ✅ Persists after refresh

**Actual Result:** _______________

---

### Test 5: Persistence - Refresh Page
**Objective:** Verify medicines saved to database

**Steps:**
1. Add a medicine: "Test Persistence"
2. Refresh page (F5)
3. Check if medicine still displays

**Expected Result:**
- ✅ Medicine still visible after refresh
- ✅ All details (quantity, unit, times) preserved
- ✅ No loss of data
- ✅ Database confirmed

**Actual Result:** _______________

---

### Test 6: Persistence - Load from Database
**Objective:** Verify medicines load from Supabase on page load

**Steps:**
1. Add multiple medicines
2. Close and reopen page
3. Check if all medicines load

**Expected Result:**
- ✅ All medicines load on page open
- ✅ No delay or missing data
- ✅ Dashboard also shows medicines
- ✅ Can immediately mark as taken

**Actual Result:** _______________

---

### Test 7: Mark as Taken
**Objective:** Verify medication status update

**Steps:**
1. Add a medicine
2. In Dashboard, find "Today's Medications"
3. Find the medicine
4. Click "Mark Taken"
5. Verify status changes

**Expected Result:**
- ✅ Button changes to "✓ Taken" (green)
- ✅ Status shows as "Taken"
- ✅ Streak increments
- ✅ Can mark multiple medicines
- ✅ Status updates persist

**Actual Result:** _______________

---

### Test 8: Frequency Options
**Objective:** Verify all frequency options work

**Steps:**
1. Add 6 medicines with different frequencies:
   - "Once daily"
   - "Twice daily"
   - "Thrice daily"
   - "Four times daily"
   - "Every alternate day"
   - "Weekly"

**Expected Result:**
- ✅ Each frequency saves correctly
- ✅ Displays correctly in list
- ✅ Displays correctly in table
- ✅ No errors for any frequency

**Actual Result:** _______________

---

### Test 9: Error Handling - Missing Required Field
**Objective:** Verify form validation

**Steps:**
1. Try to add medicine without:
   - **Name:** Leave empty, try submit
   - **Quantity:** Leave empty, try submit
   - **Unit:** Leave unselected, try submit
   - **Times:** Remove all times, try submit

**Expected Result:**
- ✅ Name empty: Shows "Please fill in medicine name..."
- ✅ Quantity empty: Shows "Please fill in medicine..."
- ✅ Unit missing: Shows "Please fill in medicine..."
- ✅ No times: Shows "Please add at least one time"
- ✅ Form does not submit on error
- ✅ Error toast appears

**Actual Result:** _______________

---

### Test 10: Error Handling - Not Authenticated
**Objective:** Verify authentication check

**Steps:**
1. Logout
2. Try to access My Care Plan page
3. If somehow able to fill form, try submit

**Expected Result:**
- ✅ Redirects to login
- ✅ Cannot access medicine form without login
- ✅ Clear error message if form accessed

**Actual Result:** _______________

---

### Test 11: Add/Remove Times
**Objective:** Verify multiple times management

**Steps:**
1. Add medicine:
   - Name: "Time Test"
   - Initial time: 08:00
2. Click "+ Add Another Time"
3. Add time: 14:00
4. Click "+ Add Another Time"
5. Add time: 20:00
6. Click "+ Add Another Time"
7. Add time: 22:00
8. Try to add 5th time (should be disabled)
9. Remove the 22:00 time
10. Verify 3 times remain
11. Submit

**Expected Result:**
- ✅ Can add up to 4 times
- ✅ "Add Another Time" disabled when 4 times exist
- ✅ Can remove individual times
- ✅ At least 1 time required (cannot remove last one)
- ✅ All remaining times saved
- ✅ Display shows all times: "08:00, 14:00, 20:00"

**Actual Result:** _______________

---

### Test 12: Special Instructions Display
**Objective:** Verify notes field works

**Steps:**
1. Add medicine:
   - Name: "Medication with Notes"
   - Quantity: 1
   - Unit: "tablet"
   - Time: 09:00
   - Notes: "Take with food, avoid alcohol"
2. Check display in list
3. Check display in table

**Expected Result:**
- ✅ List shows: "📝 Take with food, avoid alcohol"
- ✅ Notes appear below medicine name
- ✅ Long notes wrap properly
- ✅ Notes preserved in database

**Actual Result:** _______________

---

### Test 13: Dashboard Integration
**Objective:** Verify medicines show in dashboard

**Steps:**
1. Add several medicines
2. Go to **Dashboard**
3. Look for "Today's Medications" section

**Expected Result:**
- ✅ Today's medications displayed
- ✅ Shows with new format: "(quantity unit)"
- ✅ Shows all times: "at 08:00, 20:00"
- ✅ Can mark as taken from dashboard
- ✅ Status updates instantly

**Actual Result:** _______________

---

### Test 14: Care Plan Table Display
**Objective:** Verify table view shows all columns

**Steps:**
1. Add 3-4 medicines with different details
2. Scroll to "Daily Medicine Checklist" section
3. Verify table columns

**Expected Result:**
- ✅ Table shows: Medicine Name | Dose | Time | Frequency | Status | Action
- ✅ Dose shows as "quantity unit" (e.g., "1 tablet")
- ✅ Time shows all times (e.g., "08:00, 20:00")
- ✅ Status shows "Pending" or "Taken"
- ✅ Action buttons work
- ✅ Table is responsive on mobile

**Actual Result:** _______________

---

### Test 15: Supabase Database Verification
**Objective:** Verify data structure in database

**Steps:**
1. Add a medicine with full details:
   - Name: "Verification Test"
   - Quantity: 2
   - Unit: "capsule"
   - Frequency: "Twice daily"
   - Times: 07:00, 19:00
   - Notes: "After meals"
2. Go to Supabase → Table Editor → medications
3. Find the record
4. Verify all fields

**Expected Result:**
- ✅ Record exists with patient_id
- ✅ name = "Verification Test"
- ✅ quantity = 2
- ✅ unit = "capsule"
- ✅ dose = "2 capsule"
- ✅ frequency = "Twice daily"
- ✅ times = ["07:00", "19:00"] (array)
- ✅ notes = "After meals"
- ✅ time = "07:00" (first time, for backwards compatibility)
- ✅ is_active = true
- ✅ streak = 0
- ✅ created_at = timestamp
- ✅ updated_at = timestamp

**Actual Result:** _______________

---

## Performance Tests

### Test P1: Response Time
**Steps:**
1. Add a medicine
2. Measure time to see toast and display update

**Expected:** < 2 seconds
**Actual:** _______________ seconds

---

### Test P2: Multiple Medicines Load
**Steps:**
1. Add 20+ medicines
2. Measure page load time

**Expected:** < 3 seconds
**Actual:** _______________ seconds

---

## Browser Compatibility Tests

### Test B1: Chrome
- [ ] Form works
- [ ] Time input works
- [ ] Displays correctly
- [ ] Persists data

### Test B2: Firefox
- [ ] Form works
- [ ] Time input works
- [ ] Displays correctly
- [ ] Persists data

### Test B3: Safari
- [ ] Form works
- [ ] Time input works
- [ ] Displays correctly
- [ ] Persists data

---

## Mobile Tests

### Test M1: Add Medicine on Mobile
**Steps:**
1. Open on mobile phone
2. Go to My Care Plan
3. Try to add medicine
4. Verify form is usable

**Expected:**
- ✅ Form responsive
- ✅ Time picker works
- ✅ All fields visible
- ✅ Submit button accessible

---

### Test M2: Dashboard on Mobile
**Steps:**
1. Open dashboard on mobile
2. Check medications section
3. Try to mark as taken

**Expected:**
- ✅ Medicines display
- ✅ Text not cut off
- ✅ Buttons clickable
- ✅ Layout responsive

---

## Summary

| Test | Status | Notes |
|------|--------|-------|
| T1 - Single Tablet | ☐ | |
| T2 - Multiple Times | ☐ | |
| T3 - Different Units | ☐ | |
| T4 - Decimal Quantity | ☐ | |
| T5 - Refresh Persistence | ☐ | |
| T6 - Load from DB | ☐ | |
| T7 - Mark as Taken | ☐ | |
| T8 - Frequencies | ☐ | |
| T9 - Validation | ☐ | |
| T10 - Auth Check | ☐ | |
| T11 - Add/Remove Times | ☐ | |
| T12 - Notes Display | ☐ | |
| T13 - Dashboard | ☐ | |
| T14 - Table View | ☐ | |
| T15 - DB Verification | ☐ | |
| P1 - Response Time | ☐ | |
| P2 - Load Time | ☐ | |

---

## Sign-Off

**Tested by:** _________________  
**Date:** _________________  
**Overall Status:** ☐ Pass  ☐ Fail  

**Issues Found:**
1. ___________________
2. ___________________
3. ___________________

**Sign-off:** ___________________
