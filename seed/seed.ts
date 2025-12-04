import { readFile } from "fs/promises";
import { resolve } from "path";
import * as readline from "readline/promises";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

interface SeedDish {
  name: string;
  tags: string[];
  recipeText?: string;
}

interface SeedData {
  tags: string[];
  dishes: SeedDish[];
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function loadSeedData(): Promise<SeedData> {
  const tagsPath = resolve(import.meta.dirname, "data/sample-tags.json");
  const dishesPath = resolve(import.meta.dirname, "data/sample-dishes.json");

  const [tagsContent, dishesContent] = await Promise.all([readFile(tagsPath, "utf-8"), readFile(dishesPath, "utf-8")]);

  const tags = JSON.parse(tagsContent) as string[];
  const dishes = JSON.parse(dishesContent) as SeedDish[];

  return { tags, dishes };
}

async function verifyUser(supabase: ReturnType<typeof createClient<Database>>, userId: string): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    console.error(`❌ User ${userId} not found`);
    return false;
  }

  console.log(`✓ Found user: ${data.user.email}`);
  return true;
}

async function seedTags(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  tagNames: string[]
): Promise<Map<string, string>> {
  console.log(`\n📝 Seeding ${tagNames.length} tags...`);

  const tagMap = new Map<string, string>();
  const tagsToInsert = tagNames.map((name) => ({
    name,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("tags")
    .upsert(tagsToInsert, {
      onConflict: "user_id,name",
      ignoreDuplicates: false,
    })
    .select("id, name");

  if (error) {
    console.error("❌ Error seeding tags:", error);
    throw error;
  }

  if (data) {
    for (const tag of data) {
      tagMap.set(tag.name, tag.id);
    }
    console.log(`✓ Seeded ${data.length} tags`);
  }

  return tagMap;
}

async function seedDishes(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  dishes: SeedDish[],
  tagMap: Map<string, string>
): Promise<void> {
  console.log(`\n🍽️  Seeding ${dishes.length} dishes...`);

  let successCount = 0;
  let errorCount = 0;

  for (const dish of dishes) {
    // Insert dish
    const { data: dishData, error: dishError } = await supabase
      .from("dishes")
      .insert({
        name: dish.name,
        recipe_text: dish.recipeText || null,
        url: null,
        user_id: userId,
      })
      .select("id")
      .single();

    if (dishError || !dishData) {
      console.error(`  ❌ Failed to insert dish "${dish.name}":`, dishError?.message);
      errorCount++;
      continue;
    }

    // Attach tags
    const tagIds = dish.tags.map((tagName) => tagMap.get(tagName)).filter((id): id is string => id !== undefined);

    if (tagIds.length > 0) {
      const dishTags = tagIds.map((tagId) => ({
        user_id: userId,
        dish_id: dishData.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase.from("dish_tags").insert(dishTags);

      if (tagsError) {
        console.error(`  ⚠️  Dish "${dish.name}" created but failed to attach tags:`, tagsError.message);
      }
    }

    console.log(`  ✓ ${dish.name} (${dish.tags.length} tags)`);
    successCount++;
  }

  console.log(`\n✓ Successfully seeded ${successCount} dishes`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} dishes failed`);
  }
}

async function main() {
  console.log("🌱 Obiadex Database Seeder\n");
  console.log("This tool will seed your database with sample dishes and tags.\n");

  // Get Supabase URL
  let supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    supabaseUrl = await prompt("Enter Supabase URL (e.g., http://127.0.0.1:54321): ");
    if (!supabaseUrl) {
      console.error("❌ Supabase URL is required");
      process.exit(1);
    }
  } else {
    console.log(`Using Supabase URL from environment: ${supabaseUrl}`);
  }

  // Get service role key
  const serviceRoleKey = await prompt("\nEnter Supabase service role key (secret key): ");
  if (!serviceRoleKey) {
    console.error("❌ Service role key is required");
    process.exit(1);
  }

  // Get user ID
  const userId = await prompt("\nEnter user ID (UUID) to seed data for: ");
  if (!userId) {
    console.error("❌ User ID is required");
    process.exit(1);
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error("❌ Invalid UUID format");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));

  // Create admin client with service role key to bypass RLS
  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify user exists
  const userExists = await verifyUser(supabase, userId);
  if (!userExists) {
    process.exit(1);
  }

  // Load seed data
  console.log("\n📂 Loading seed data...");
  const seedData = await loadSeedData();
  console.log(`✓ Loaded ${seedData.tags.length} tags and ${seedData.dishes.length} dishes`);

  // Confirm before proceeding
  const confirm = await prompt(
    `\n⚠️  This will seed ${seedData.dishes.length} dishes with ${seedData.tags.length} tags. Continue? (yes/no): `
  );
  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    console.log("❌ Seed cancelled");
    process.exit(0);
  }

  // Seed tags first
  const tagMap = await seedTags(supabase, userId, seedData.tags);

  // Seed dishes with tag relationships
  await seedDishes(supabase, userId, seedData.dishes, tagMap);

  console.log("\n✅ Seed process completed!");
}

main().catch((error) => {
  console.error("\n💥 Seed process failed:", error);
  process.exit(1);
});
