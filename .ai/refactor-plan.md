Plan: Refactor Fetch to useQuery/useMutation Hooks

Overview

Replace all native fetch calls with custom useQuery and useMutation hooks using axios, with centralized error handling and toast notifications via sonner.

Scope

- 11 files with fetch calls to migrate
- No caching (keep it simple, unlike react-query)
- Full TypeScript type safety (no any)
- Polish error messages with toast notifications
- AbortController support for request cancellation
- Debouncing support for search queries

Implementation Steps

1.  Create HTTP Infrastructure (New Files)

1.1 Create src/lib/http/types.ts

Type definitions for hooks:

- ApiError interface (status, message, code, details)
- UseQueryOptions<TData> interface
- UseQueryResult<TData> interface
- UseMutationOptions<TData, TVariables> interface
- UseMutationResult<TData, TVariables> interface

  1.2 Create src/lib/http/axios.config.ts

- Configure axios instance with base URL / and JSON headers
- 30-second timeout
- Export apiClient instance
- Basic request/response interceptors

  1.3 Create src/lib/http/error-handler.ts

- ERROR_MESSAGES map for Polish error messages (401, 404, 422, 429, 500, etc.)
- handleApiError() function that:
  - Extracts status and message from AxiosError
  - Handles 401 with redirect to /login
  - Shows toast.error() for errors
  - Returns typed ApiError object

  1.4 Create src/lib/http/hooks/useQuery.ts

Generic GET request hook with:

- State: data, isLoading, error
- Options: enabled, debounce, onSuccess, onError
- AbortController for cancellation
- Debouncing support via setTimeout
- Auto-fetch on mount (if enabled and url not null)
- Returns: { data, isLoading, error, refetch, abort }

  1.5 Create src/lib/http/hooks/useMutation.ts

Generic POST/PUT/DELETE hook with:

- State: isLoading, error
- Options: method, onSuccess, onError, successMessage, showErrorToast
- Dynamic URL support (string or function)
- Toast success/error messages
- Returns: { mutate, mutateAsync, isLoading, isSubmitting, isDeleting, error, reset }

  1.6 Create src/lib/http/hooks/index.ts

Barrel export for hooks

2.  Add Toaster to Layout

Modify src/layouts/Layout.astro:

- Import Toaster from @/components/ui/sonner
- Add <Toaster client:load position="top-right" /> in body

3.  Migrate Components (11 Files)

3.1 Auth Forms (3 files)

src/components/LoginForm.tsx

- Replace fetch POST with useMutation<AuthLoginResponse, AuthLoginCommand>
- Remove manual error state, use hook's error
- Use isSubmitting instead of formState.isSubmitting
- Remove try-catch, let hook handle errors
- Keep react-hook-form integration

src/components/SignupForm.tsx

- Replace fetch POST with useMutation
- Add successMessage option for toast
- Use onSuccess callback for redirect

src/components/ResetPasswordForm.tsx

- Replace fetch POST with useMutation
- Use hook's loading state
- Simplify error handling

  3.2 Dish Management (3 files)

src/components/DishForm.tsx (6 fetch calls!)

- GET tags: useQuery<TagListResponse>('/api/tags')
- GET dish (edit mode): useQuery<DishDetailResponse>(dishId ? '/api/dishes/${dishId}' : null)
- POST create tag: useMutation<TagDTO, TagCreateCommand> with 409 conflict handling
- DELETE tag: useMutation with method DELETE
- POST create dish: useMutation<DishDTO, DishCreateCommand>
- PUT update dish: useMutation<DishDTO, DishUpdateCommand> with dynamic URL
- Remove manual loading states (isLoadingTags, etc.)
- Remove manual AbortControllers

src/components/DishCard.tsx

- DELETE dish: useMutation with method DELETE
- Use isDeleting instead of local state
- Add success callback for onDeleteSuccess

src/components/DishesView.tsx (3 fetch calls)

- GET tags with counts: useQuery<TagListResponse>('/api/tags?includeCounts=true')
- GET dishes with filters: useQuery<DishListResponse> with dynamic URL based on filters
- Remove refetch promise chain, use refetch() from hook
- Remove manual loading states and AbortControllers

  3.3 Day Planning (2 files)

src/components/DayPlanOverlay.tsx

- GET day plan: useQuery<DayPlanResponse> with enabled: !!day
- DELETE day plan: useMutation with method DELETE
- Use isDeleting from hook

src/components/hooks/useDishPicker.ts

- GET tags: useQuery<TagListResponse>('/api/tags?includeCounts=true', { enabled: false })
- GET filtered dishes: useQuery<DishListResponse> with dynamic URL, debouncing
- PUT save day plan: useMutation with method PUT
- Remove internal state machine ("idle" | "loading" | "error")

  3.4 Week Viewport (1 file)

src/components/hooks/useWeekViewport.ts

- GET day plans range: useQuery<DayPlanListResponse> with dynamic date range URL
- Use debouncing option from hook
- Remove manual AbortController and debounce timer

  3.5 Header (1 file)

src/components/Header.tsx

- Check for logout fetch call
- Replace with useMutation if exists

4.  Type Safety & Quality Checks

4.1 Run TypeScript Check

npx tsc --noEmit

- Fix all type errors
- Ensure no any types exist

  4.2 Run Linter

npm run lint

- Fix all lint errors
- Run npm run lint:fix for auto-fixes

5.  Testing Strategy

Test each migrated component:

- Login/Signup/Reset forms
- Dish CRUD operations (create, read, update, delete)
- Tag management
- Day planning
- Week navigation
- Search and filtering

Verify:

- Loading states display correctly
- Error toasts appear with Polish messages
- 401 redirects to login
- Success toasts show for mutations
- AbortController cancels requests properly
- Debouncing works for search

Critical Files to Create

1.  src/lib/http/types.ts - TypeScript types
2.  src/lib/http/axios.config.ts - Axios configuration
3.  src/lib/http/error-handler.ts - Error handling with toasts
4.  src/lib/http/hooks/useQuery.ts - GET requests hook
5.  src/lib/http/hooks/useMutation.ts - POST/PUT/DELETE hook
6.  src/lib/http/hooks/index.ts - Barrel export

Critical Files to Modify

1.  src/layouts/Layout.astro - Add Toaster
2.  src/components/LoginForm.tsx - Auth
3.  src/components/SignupForm.tsx - Auth
4.  src/components/ResetPasswordForm.tsx - Auth
5.  src/components/DishForm.tsx - 6 fetch calls
6.  src/components/DishCard.tsx - Delete dish
7.  src/components/DishesView.tsx - 3 fetch calls
8.  src/components/DayPlanOverlay.tsx - Day planning
9.  src/components/hooks/useDishPicker.ts - Dish picker
10. src/components/hooks/useWeekViewport.ts - Week viewport
11. src/components/Header.tsx - Logout

Success Criteria

- ✅ Zero any types in codebase
- ✅ Zero TypeScript errors (npx tsc --noEmit)
- ✅ Zero lint errors (npm run lint)
- ✅ All fetch calls replaced with hooks
- ✅ Toast notifications working for errors
- ✅ Polish error messages displayed
- ✅ Loading states working correctly
- ✅ AbortController cancellation working
- ✅ 401 redirects to login automatically

Benefits

- DRY: Eliminate duplicated fetch/error handling code
- Type Safety: Full TypeScript generics
- User Experience: Toast notifications instead of console.logs
- Maintainability: Centralized error messages
- Consistency: Same API across all components
- Simple: No caching complexity (unlike react-query/swr)
