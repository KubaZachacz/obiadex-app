# Playwright E2E Test Suite

## Test Status

### ✅ Passing Tests (10/10)
**Auth Tests** (`tests/e2e/auth.spec.ts`) - **All passing in 25.3s**
- Route protection (5 tests)
- Form validation (5 tests)

### ⏳ Requires Supabase Setup
**Dishes CRUD Tests** (`tests/e2e/dishes-crud.spec.ts`) - 7 tests written, need auth
- Show dishes page elements
- Open create dialog
- Validate required fields
- Validate name length
- Create dish successfully
- Empty state
- Pagination

### 📋 Planned Tests
- **Dishes Filter** - Search, tag filter, pagination
- **Day Plans** - Assign dish to day, edit, view modes

## Setup Requirements

### Current Setup (✅ Working)
The auth tests work without any additional setup because they only test:
- Route protection (redirects)
- UI elements visibility
- Client-side form validation

### Supabase Setup (⚠️ Required for CRUD tests)
To run dishes CRUD and day plans tests:

1. **Create test user in Supabase**
   ```bash
   # Option 1: Via Supabase Dashboard
   # Go to Authentication > Users > Add User
   # Email: test@obiadex.test
   # Password: TestPassword123!

   # Option 2: Via signup API (if working)
   curl -X POST http://localhost:4321/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@obiadex.test","password":"TestPassword123!"}'
   ```

2. **Seed test data** (optional, for better test coverage)
   ```bash
   npm run seed
   # Follow prompts to add dishes and tags for the test user
   ```

3. **Configure environment**
   - Ensure `.env` has valid `SUPABASE_URL` and `SUPABASE_KEY`
   - Test database should be separate from production

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/auth.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run in UI mode (interactive)
npm run test:e2e -- --ui

# Run with specific grep pattern
npm run test:e2e -- -g "should validate"
```

## Test Architecture

### Auth Fixture (`tests/e2e/fixtures/auth.ts`)
Provides `authenticatedPage` fixture that:
1. Tries to load existing auth state
2. Navigates to home
3. If redirected to login, performs login with TEST_USER
4. Returns authenticated page context

### Test Users
- `TEST_USER`: test@obiadex.test / TestPassword123!
- `TEST_USER_2`: test2@obiadex.test / TestPassword456!

### Key Patterns

**Wait for React hydration:**
```typescript
await page.goto("/login", { waitUntil: "networkidle" });

await page.waitForFunction(() => {
  const form = document.querySelector("form");
  return form && !form.hasAttribute("inert");
});
```

**Use role-based selectors:**
```typescript
const errorAlert = page.getByRole("alert");
await expect(errorAlert).toBeVisible();
await expect(errorAlert).toContainText(/error message/i);
```

## Troubleshooting

### Tests stuck on login page
**Problem**: `performLogin` fails, stays on `/login` with credentials in URL
**Solution**: Ensure test user exists in Supabase Auth

### React component not hydrating
**Problem**: Validation errors not appearing
**Solution**: Use `waitUntil: "networkidle"` and wait for form to be interactive

### Flaky tests
**Problem**: Tests pass/fail randomly
**Solution**: Increase timeouts, add proper waits, use `waitForFunction` instead of `waitForTimeout`

## Next Steps

1. **Set up Supabase for E2E testing**
   - Create test database or use local Supabase
   - Create test users
   - Seed sample data

2. **Complete dishes tests**
   - Run dishes-crud.spec.ts and fix any issues
   - Add dishes-filter.spec.ts
   - Add edit dish test

3. **Add day plans tests**
   - Create day-plans.spec.ts
   - Test assign dish, change dish, view/edit modes

4. **Add data-testid attributes** (if needed)
   - Add to critical UI elements for more stable selectors
   - Consider adding to FAB, dialogs, form fields

5. **CI/CD integration**
   - Configure GitHub Actions or similar
   - Use Playwright Docker image
   - Set up test database for CI
