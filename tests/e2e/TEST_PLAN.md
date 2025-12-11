# Minimal E2E Test Plan

This document outlines the critical E2E test scenarios based on `.ai/tests/test-plan.md`.

## Test Suites

### 1. Auth (`auth.spec.ts`)
**Priority: Critical** - Guards all protected routes and data

- **Login successful flow**
  - Navigate to `/login`
  - Submit valid credentials
  - Verify redirect to home `/`
  - Verify session cookie is set

- **Login failed flow**
  - Navigate to `/login`
  - Submit invalid credentials
  - Verify 401 error message displayed
  - Verify stays on `/login`

- **Signup successful flow**
  - Navigate to `/signup`
  - Submit valid new user data
  - Verify account created (201)
  - Verify redirect to home or login

- **Route protection**
  - Try to access `/` without auth
  - Verify redirect to `/login`
  - Try to access `/dishes` without auth
  - Verify redirect to `/login`

### 2. Dishes CRUD (`dishes-crud.spec.ts`)
**Priority: Critical** - Core functionality for dish catalog

- **Create dish with tags**
  - Navigate to `/dishes` (authenticated)
  - Open create dish dialog/form
  - Fill name, recipe text, tags (min 1)
  - Submit and verify 201
  - Verify new dish appears in list

- **Edit dish with tags**
  - Navigate to `/dishes`
  - Select existing dish
  - Open edit form
  - Modify name and tags (add/remove)
  - Submit and verify 200
  - Verify changes reflected in list

- **Validation errors**
  - Try to create dish without tags → verify 422 error
  - Try to create dish with name < 3 chars → verify error
  - Try to create dish with name > 80 chars → verify error

### 3. Dishes Filter & Search (`dishes-filter.spec.ts`)
**Priority: High** - Critical for dish discovery

- **Search dishes**
  - Navigate to `/dishes`
  - Type in search box (debounced)
  - Verify filtered results
  - Clear search and verify all dishes shown

- **Filter by tags (AND logic)**
  - Navigate to `/dishes`
  - Select 2+ tags in filter
  - Verify only dishes with ALL tags shown
  - Remove filter and verify all dishes shown

- **Pagination**
  - Navigate to `/dishes`
  - Verify page size = 20
  - Navigate to page 2
  - Verify different results
  - Verify filters preserved across pages

### 4. Day Plans (`day-plans.spec.ts`)
**Priority: Critical** - Core meal planning functionality

- **Assign dish to a day**
  - Navigate to home `/`
  - Click on a day tile
  - Verify day overlay opens with `?day=YYYY-MM-DD`
  - Select a dish from picker
  - Verify PUT /day-plans/{day} returns 201/200
  - Verify day tile updates with dish name

- **Change dish for existing plan**
  - Navigate to home `/`
  - Click on day with existing dish
  - Select different dish
  - Verify update (200)
  - Verify tile reflects new dish

- **View mode vs edit mode**
  - Click day with dish in view mode
  - Verify dish details shown
  - Switch to edit mode
  - Verify dish picker available

### 5. Tags Global Delete (`tags-delete.spec.ts`)
**Priority: Medium** - Important for tag management

- **Delete tag globally**
  - Navigate to `/dishes`
  - Open dish editor with multiple tags
  - Remove a tag that's used by multiple dishes
  - Confirm global delete when prompted
  - Verify DELETE /tags/{id} called
  - Verify tag removed from all dishes

## Test Data Requirements

- **Test users**: At least 2 users with isolated data (test RLS)
- **Test dishes**: 25+ dishes to test pagination
- **Test tags**: 5-10 tags with varying usage
- **Test day plans**: Several days with assigned dishes

## Setup Requirements

1. Test database seeded with sample data
2. Auth storage state files in `tests/e2e/.auth/`
3. Environment variables in `.env` (Supabase URL/keys)

## Coverage Goals

- **Auth flows**: 100% of critical paths (login, signup, route guard)
- **Dishes CRUD**: 100% of create/edit flows with validations
- **Filters**: Core search + tag filter + pagination
- **Day plans**: Assign, update, view modes
- **Mobile**: Run subset on mobile viewport (day overlay, dishes list)

## Test Execution Order

1. Run `auth.spec.ts` first (creates auth state)
2. Run other tests in parallel using stored auth
3. Each test should be independent (can run alone)
4. Use fixtures for common setup (authenticated page, test data)

## Acceptance Criteria

- All tests pass on both desktop and mobile viewports
- No false positives (flaky tests)
- Tests run in < 5 minutes total
- Clear error messages on failure
- Screenshots captured on failures
