# Postman Collection Guide

## Overview

This guide explains how to use the Obiadex API Postman collection to test all 19 API endpoints.

## Setup

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select `Obiadex_API.postman_collection.json`
4. The collection will appear in your workspace with 5 folders:
   - Authentication (4 requests)
   - Tags (4 requests)
   - Dishes (6 requests)
   - Day Plans (4 requests)
   - Analytics (1 request)

### 2. Configure Environment

The collection includes built-in variables, but you can also create a Postman environment:

**Option A: Use Collection Variables (Recommended)**
- Variables are already configured in the collection
- `base_url`: `http://localhost:3000` (change if using different port)
- `access_token`: Auto-populated by login request
- `tag_id`: Auto-populated when creating tags
- `dish_id`: Auto-populated when creating dishes

**Option B: Create Postman Environment**
1. Click **Environments** in left sidebar
2. Click **+** to create new environment
3. Add variables:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (leave empty, will be set by login)
   - `tag_id`: (leave empty)
   - `dish_id`: (leave empty)
4. Save and select the environment

### 3. Start Development Server

```bash
npm run dev
```

Server should be running on `http://localhost:3000`

## Testing Flow

### Step 1: Authentication

**A. Create Account**
1. Open **Authentication → Signup**
2. Request body is pre-filled:
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123"
   }
   ```
3. Click **Send**
4. Expect **201 Created** response with userId and email
5. If you get **409 Conflict**, the email already exists (skip to login)

**B. Login**
1. Open **Authentication → Login**
2. Same credentials as signup
3. Click **Send**
4. Expect **200 OK** response with `accessToken` and `expiresInSec`
5. **Token is automatically saved** to `access_token` variable
6. All subsequent requests will use this token

**C. Test Logout (Optional)**
1. Open **Authentication → Logout**
2. Click **Send**
3. Expect **204 No Content**
4. Token is cleared from environment
5. **Note:** You'll need to login again to continue testing

**D. Reset Password (Optional)**
1. Open **Authentication → Reset Password**
2. Enter email in request body
3. Click **Send**
4. Always returns **202 Accepted** (prevents email enumeration)
5. Check email for reset link (if configured in Supabase)

### Step 2: Create Tags

**A. Bulk Create Tags**
1. Open **Tags → Bulk Upsert Tags**
2. Pre-filled body creates 4 tags:
   ```json
   {
     "names": ["italian", "pasta", "dinner", "quick"]
   }
   ```
3. Click **Send**
4. Expect **200 OK** with array of created tags
5. Note: Uses upsert logic, safe to run multiple times

**B. Create Single Tag**
1. Open **Tags → Create Single Tag**
2. Body: `{ "name": "Breakfast" }`
3. Click **Send**
4. Expect **201 Created**
5. **Tag ID is automatically saved** to `tag_id` variable
6. Use this ID for filtering dishes later

**C. List All Tags**
1. Open **Tags → List Tags**
2. Query param `includeCounts=true` adds dish counts
3. Click **Send**
4. Expect **200 OK** with array of all your tags

### Step 3: Create Dishes

**A. Create Dish with Tags**
1. Open **Dishes → Create Dish**
2. Pre-filled body:
   ```json
   {
     "name": "Spaghetti Carbonara",
     "recipeText": "Classic Italian pasta...",
     "url": "https://example.com/carbonara-recipe",
     "tagSelection": {
       "tagNames": ["italian", "pasta", "dinner"]
     }
   }
   ```
3. Click **Send**
4. Expect **201 Created** with dish and associated tags
5. **Dish ID is automatically saved** to `dish_id` variable

**B. Create More Dishes**
1. Duplicate the Create Dish request (right-click → Duplicate)
2. Change the name and other fields
3. Create 5-10 dishes for better testing
4. Use different tag combinations

### Step 4: Test Dish Queries

**A. List All Dishes**
1. Open **Dishes → List Dishes**
2. Default params: `page=1&pageSize=20&sort=created_desc`
3. Click **Send**
4. Expect **200 OK** with pagination:
   ```json
   {
     "data": [...],
     "page": 1,
     "pageSize": 20,
     "total": 10,
     "totalPages": 1
   }
   ```

**B. Filter by Tags**
1. Open **Dishes → List Dishes - Filtered by Tags**
2. URL includes multiple `tagId` params (AND logic)
3. Replace `{{tag_id}}` with actual tag ID or enable the param
4. Click **Send**
5. Only dishes with ALL specified tags are returned

**C. Text Search**
1. Open **Dishes → List Dishes**
2. Enable the `q` query param
3. Set value: `pasta`
4. Click **Send**
5. Returns dishes matching "pasta" in name, recipe, or URL

**D. Sort by Usage Priority**
1. Open **Dishes → List Dishes**
2. Change `sort` param to `usage_prio`
3. Click **Send**
4. Returns least recently used dishes first, never-used last

**E. Get Single Dish**
1. Open **Dishes → Get Dish**
2. Uses `{{dish_id}}` variable from create
3. Click **Send**
4. Expect **200 OK** with full dish details and tags

**F. Update Dish**
1. Open **Dishes → Update Dish**
2. Pre-filled partial update (recipe + tags)
3. Click **Send**
4. Expect **200 OK** with updated dish

### Step 5: Day Plans

**A. Assign Dish to Day**
1. Open **Day Plans → Create/Update Day Plan**
2. URL: `/api/day-plans/2025-01-15` (change date if needed)
3. Body: `{ "dishId": "{{dish_id}}" }`
4. Click **Send**
5. Expect **201 Created** (first time) or **200 OK** (update)

**B. Create Multiple Day Plans**
1. Duplicate the request
2. Change the date in URL (e.g., 2025-01-16, 2025-01-17)
3. Create plans for several days
4. Use different dishes for variety

**C. Get Single Day**
1. Open **Day Plans → Get Single Day**
2. URL: `/api/day-plans/2025-01-15`
3. Click **Send**
4. Expect **200 OK** with day plan and full dish details
5. If no plan exists: **404 Not Found**

**D. Get Date Range**
1. Open **Day Plans → Get Date Range**
2. Query params:
   - `start=2025-01-15`
   - `end=2025-01-31`
   - `sort=asc`
3. Click **Send**
4. Expect **200 OK** with array of day plans and range info

**E. Delete Day Plan**
1. Open **Day Plans → Delete Day Plan**
2. URL: `/api/day-plans/2025-01-15`
3. Click **Send**
4. Expect **204 No Content**

### Step 6: Analytics

**A. Get Summary**
1. Open **Analytics → Get Summary**
2. Query params:
   - `start=2025-01-01T00:00:00Z`
   - `end=2025-01-31T23:59:59Z`
3. Adjust dates to match when you created dishes/plans
4. Click **Send**
5. Expect **200 OK**:
   ```json
   {
     "dishAdded": { "count": 5 },
     "dayPlanned": { "count": 3 }
   }
   ```
6. Verify `Cache-Control: no-store` header is present

### Step 7: Cleanup (Optional)

**A. Delete Dishes**
1. Open **Dishes → Delete Dish**
2. Uses `{{dish_id}}` variable
3. Click **Send**
4. Expect **204 No Content**

**B. Delete Tags**
1. Open **Tags → Delete Tag**
2. Uses `{{tag_id}}` variable
3. Click **Send**
4. Expect **204 No Content**
5. Note: Deleting tag also removes dish_tags associations

## Test Scripts

Each request includes test scripts that automatically validate responses:

### Authentication Tests
- ✅ Correct status codes (200, 201, 204, 202)
- ✅ Response structure (userId, email, accessToken)
- ✅ Auto-save token to environment
- ✅ Auto-clear token on logout

### Tags Tests
- ✅ Response has data array
- ✅ Single tag has id, name, createdAt
- ✅ Bulk response has tags array
- ✅ Auto-save tag_id for later use

### Dishes Tests
- ✅ Pagination structure (data, page, pageSize, total, totalPages)
- ✅ Dish has all required fields
- ✅ Tags are included in response
- ✅ Auto-save dish_id for later use
- ✅ Filtered results match tag criteria

### Day Plans Tests
- ✅ Response has data and range
- ✅ Single day has id, day, dish
- ✅ Correct status codes (200 update, 201 create)

### Analytics Tests
- ✅ Response has dishAdded and dayPlanned counts
- ✅ Cache-Control header is no-store

**View Test Results:**
1. After sending request, click **Test Results** tab
2. Green checkmarks = passing tests
3. Red X = failing tests (indicates API issue)

## Advanced Testing Scenarios

### Test Pagination
1. Create 25+ dishes
2. List with `pageSize=10`
3. Increment `page` parameter (1, 2, 3...)
4. Verify total count matches across pages

### Test Tag Filtering (AND Logic)
1. Create tags: "italian", "vegetarian", "quick"
2. Create dishes:
   - Dish A: ["italian", "vegetarian"]
   - Dish B: ["italian", "quick"]
   - Dish C: ["italian", "vegetarian", "quick"]
3. Filter by `tagId=italian&tagId=vegetarian`
4. Should return only Dish A and Dish C (both have ALL tags)

### Test Usage Priority Sorting
1. Create 5 dishes
2. Assign dishes to days:
   - Dish 1 → 2025-01-10
   - Dish 2 → 2025-01-15
   - Dish 3 → 2025-01-20
   - Dishes 4 & 5 → never assigned
3. List with `sort=usage_prio`
4. Order should be: Dish 1, Dish 2, Dish 3, Dish 4, Dish 5

### Test Error Cases

**401 Unauthorized:**
1. Clear `access_token` variable
2. Try any authenticated endpoint
3. Expect **401**

**404 Not Found:**
1. Use non-existent UUID for dish/tag/day-plan
2. Expect **404**

**409 Conflict:**
1. Create tag "breakfast"
2. Create same tag again (single create, not bulk)
3. Expect **409**

**422 Unprocessable Entity:**
1. Create dish with non-existent tag IDs
2. Expect **422**

**400 Bad Request:**
1. Send invalid date format to day-plans
2. Exceed 180-day range limit
3. Send invalid JSON body
4. Expect **400**

## Troubleshooting

### "401 Unauthorized" on all requests
**Solution:** Run Login request again to refresh token

### "404 Not Found" when using variables
**Solution:**
1. Check variable values in environment/collection
2. Ensure Create requests ran successfully and saved IDs
3. Manually copy IDs from responses if needed

### "Cannot connect" error
**Solution:**
1. Verify dev server is running: `npm run dev`
2. Check `base_url` variable matches server URL
3. Try `http://localhost:3000` instead of `127.0.0.1`

### Test scripts failing
**Solution:**
1. Check response status code first
2. Read error message in response body
3. Verify request body matches expected schema
4. Check server logs for detailed error

### Token expired
**Solution:**
1. Run Login request again
2. Tokens expire after 3600 seconds (1 hour) by default
3. New token automatically saved

## Environment Variables Reference

| Variable | Description | Auto-Set By |
|----------|-------------|-------------|
| `base_url` | API base URL | Manual (default: localhost:3000) |
| `access_token` | JWT auth token | Login request |
| `tag_id` | Last created tag ID | Create Single Tag |
| `dish_id` | Last created dish ID | Create Dish |

## Tips

1. **Run in sequence:** Start with Auth → Tags → Dishes → Day Plans → Analytics
2. **Use Collection Runner:** Run entire collection automatically
   - Click collection name → Run
   - Select requests to run
   - Set iterations and delay
3. **Save examples:** Right-click response → Save as Example
4. **Duplicate requests:** Test different scenarios without modifying originals
5. **Use variables:** Replace hard-coded IDs with `{{variable_name}}`
6. **Check console:** View detailed request/response in Postman console
7. **Export results:** Collection Runner can export test results

## Next Steps

1. **Integrate with CI/CD:**
   - Use Newman (Postman CLI) to run collection in CI pipeline
   - `npm install -g newman`
   - `newman run Obiadex_API.postman_collection.json`

2. **Add more test scenarios:**
   - Boundary testing (max lengths, min values)
   - Concurrent requests (multiple users)
   - Performance testing (response times)

3. **Create monitoring:**
   - Use Postman Monitors to run collection on schedule
   - Get alerts when tests fail
   - Track API availability

## Support

For issues with the API implementation, see:
- `API_IMPLEMENTATION.md` - Complete API documentation
- `.ai/*-implementation-plan.md` - Original implementation plans
- Server logs in terminal where `npm run dev` is running
