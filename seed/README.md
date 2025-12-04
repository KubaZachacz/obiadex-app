# Seed Data for Obiadex

This directory contains tools and sample data for seeding your Obiadex database with initial dishes and tags for development and testing purposes.

## Directory Structure

```
seed/
├── data/
│   ├── sample-tags.json          # List of tag names to seed
│   └── sample-dishes.json        # List of dishes with tags and recipes
├── seed.ts                       # TypeScript seeding script
└── README.md                     # This file
```

## Quick Start

### Prerequisites

1. **Supabase Service Role Key**: You need the service role key (not the anon key) to bypass Row Level Security policies
2. **User ID**: The UUID of the user you want to seed data for

### Run the Seeder

Simply run the seed command - it will interactively prompt you for the required information:

```bash
npm run seed
```

The script will ask you for:
1. **Supabase URL** (optional - uses `SUPABASE_URL` from `.env` if available)
2. **Service role key** (the secret key from Supabase)
3. **User ID** (UUID of the user to seed data for)

### For Local Development

If you're running Supabase locally (via `npx supabase start`), use these values:

**Supabase URL**: `http://127.0.0.1:54321`

**Service Role Key**: Get it from:
```bash
npx supabase status
```
Look for the "Secret key" line (e.g., `sb_secret_...`)

**User ID**: Get it from Supabase Studio at http://127.0.0.1:54323
- Go to Authentication → Users
- Find your test user and copy their UUID

Or query directly:
```sql
SELECT id, email FROM auth.users;
```

## What Gets Seeded

### Tags (14 tags)
- quick
- vegetarian
- chicken
- pasta
- soup
- salad
- beef
- fish
- spicy
- comfort-food
- healthy
- budget-friendly
- family-favorite
- meal-prep

### Dishes (15 dishes)
Each dish includes:
- Name
- 1-3 associated tags
- Optional recipe text (1 sentence description)

Sample dishes include:
- Spaghetti Carbonara
- Chicken Stir-Fry
- Vegetable Curry
- Caesar Salad
- Beef Tacos
- And more...

## Customizing Seed Data

### Adding Your Own Tags

Edit `data/sample-tags.json`:

```json
[
  "italian",
  "mexican",
  "asian",
  "your-custom-tag"
]
```

### Adding Your Own Dishes

Edit `data/sample-dishes.json`:

```json
[
  {
    "name": "My Custom Dish",
    "tags": ["tag1", "tag2"],
    "recipeText": "Optional one-sentence description"
  }
]
```

**Important:**
- Each dish must have 1-3 tags
- Tags must exist in the `sample-tags.json` file
- `recipeText` is optional

## How It Works

The seeding script:

1. **Verifies the user** exists in Supabase Auth
2. **Seeds tags first** using upsert (won't create duplicates)
3. **Seeds dishes** one by one with their tag relationships
4. **Handles errors gracefully** and reports which dishes failed

The script uses the Supabase service role key to bypass Row Level Security policies, allowing it to insert data for any user.

## Troubleshooting

### "User not found" error
- Verify the UUID is correct (must be a valid UUID format)
- Check that the user exists in Supabase Auth dashboard

### "Missing environment variables" error
- Make sure you set both `SEED_USER_ID` and `SUPABASE_SERVICE_ROLE_KEY`
- Check that your `.env` file contains `SUPABASE_URL`

### "Failed to insert dish" errors
- Check that all tags referenced in dishes exist in `sample-tags.json`
- Verify your database migrations are up to date
- Check Supabase logs for detailed error messages

### Permission errors
- Ensure you're using the **service role key**, not the anon key
- The service role key should start with `eyJ...` and be much longer than the anon key

## Advanced Usage

### Seeding Multiple Users

Simply run the script multiple times - it will prompt you for each user ID:

```bash
npm run seed  # Enter user 1 details
npm run seed  # Enter user 2 details
```

### Custom Seed Files

You can modify `seed.ts` to load different JSON files:

```typescript
const tagsPath = resolve(import.meta.dirname, "data/your-tags.json");
const dishesPath = resolve(import.meta.dirname, "data/your-dishes.json");
```

## Security Notes

- **Never commit your service role key** to version control
- The service role key bypasses all RLS policies - keep it secure
- Only use this seeding tool in development/staging environments
- For production data seeding, consider using Supabase SQL migrations instead

## Sample Output

```
🌱 Starting seed process...

✓ Found user: user@example.com

📂 Loading seed data...
✓ Loaded 14 tags and 15 dishes

📝 Seeding 14 tags...
✓ Seeded 14 tags

🍽️  Seeding 15 dishes...
  ✓ Spaghetti Carbonara (3 tags)
  ✓ Chicken Stir-Fry (3 tags)
  ✓ Vegetable Curry (3 tags)
  ...

✓ Successfully seeded 15 dishes

✅ Seed process completed!
```
