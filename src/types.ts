import type { Tables, TablesInsert } from "./db/database.types";

/**
 * DB-backed row helpers used to keep DTOs aligned with Supabase schema.
 */
type DishRow = Tables<"dishes">;
type TagRow = Tables<"tags">;
type DayPlanRow = Tables<"day_plans">;
type DishTagRow = Tables<"dish_tags">;
type EventRow = Tables<"events">;

type NonEmptyArray<T> = [T, ...T[]];

/**
 * Enforces that at least one of tagNames/tagIds is present on commands that
 * manipulate dish-tag relationships.
 */
export type TagSelection =
  | {
      tagNames: NonEmptyArray<string>;
      tagIds?: NonEmptyArray<TagRow["id"]>;
    }
  | {
      tagNames?: NonEmptyArray<string>;
      tagIds: NonEmptyArray<TagRow["id"]>;
    };

export interface Paginated<TItem> {
  data: TItem[];
  nextCursor: string | null;
}

export interface PagedResponse<TItem> {
  data: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// AUTH
export interface AuthSignupCommand {
  email: string;
  password: string;
}

export interface AuthSignupResponse {
  userId: string;
  email: string;
}

export interface AuthLoginCommand {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  expiresInSec: number;
}

export interface AuthResetPasswordCommand {
  email: string;
}

// TAGS
export interface TagDTO {
  id: TagRow["id"];
  name: TagRow["name"];
  createdAt: TagRow["created_at"];
  updatedAt: TagRow["updated_at"];
  userId: TagRow["user_id"];
}

export interface TagListItemDTO extends TagDTO {
  /**
   * Included only when TagListQuery.includeCounts === true.
   */
  dishCount?: number;
}

export type TagListResponse = Paginated<TagListItemDTO>;

export interface TagListQuery {
  q?: string;
  limit?: number;
  cursor?: string;
  page?: number;
  includeCounts?: boolean;
}

export type TagCreateCommand = Pick<TagRow, "name">;

export interface TagUpsertManyCommand {
  names: NonEmptyArray<TagRow["name"]>;
}

export interface TagDeleteResult {
  deleted: true;
  detachedFrom: number;
}

// DISHES
export interface DishDTO {
  id: DishRow["id"];
  name: DishRow["name"];
  recipeText: DishRow["recipe_text"];
  url: DishRow["url"];
  createdAt: DishRow["created_at"];
  updatedAt: DishRow["updated_at"];
  userId: DishRow["user_id"];
  tags: TagDTO[];
}

export interface DishListItemDTO extends DishDTO {
  /**
   * Present only when sort=usage_prio.
   */
  lastUsedDay?: DayPlanRow["day"] | null;
}

export type DishListResponse = PagedResponse<DishListItemDTO>;

export type DishDetailResponse = DishDTO;

export type DishCreateCommand = TagSelection & {
  name: DishRow["name"];
  recipeText?: DishRow["recipe_text"];
  url?: DishRow["url"];
};

export type DishUpdateCommand = TagSelection & {
  name: DishRow["name"];
  recipeText: DishRow["recipe_text"];
  url: DishRow["url"];
};

export type DishAttachTagsCommand = TagSelection;

export interface DishAttachTagsResponse {
  tags: TagDTO[];
}

export interface DishListQuery {
  cursor?: string;
  limit?: number;
  page?: number;
  q?: string;
  tagId?: TagRow["id"][];
  sort?: "created_desc" | "name_asc" | "usage_prio";
}

export interface DishDetachTagParams {
  dishId: DishRow["id"];
  tagId: TagRow["id"];
}

// DAY PLANS
export interface DishSummaryDTO {
  id: DishRow["id"];
  name: DishRow["name"];
}

export interface DishWithTagsDTO extends DishSummaryDTO {
  tags: TagDTO[];
}

export interface DayPlanDTO {
  id: DayPlanRow["id"];
  day: DayPlanRow["day"];
  dish: DishWithTagsDTO;
}

export interface DayPlanListItemDTO {
  id: DayPlanRow["id"];
  day: DayPlanRow["day"];
  dish: DishSummaryDTO;
}

export interface DayPlanRangeResponse {
  data: DayPlanListItemDTO[];
  range: {
    start: string;
    end: string;
  };
}

export type DayPlanListResponse = Paginated<DayPlanListItemDTO>;

export interface DayPlanRangeQuery {
  start: DayPlanRow["day"];
  end: DayPlanRow["day"];
  sort?: "asc" | "desc";
}

export interface DayPlanCursorQuery {
  cursor?: DayPlanRow["day"];
  dir?: "back" | "forward";
  limit?: number;
}

export type DayPlanListQuery = DayPlanRangeQuery | DayPlanCursorQuery;

export interface DayPlanUpsertCommand {
  dishId: DishRow["id"];
}

export type DayPlanUpsertResponse = DayPlanListItemDTO;

// ANALYTICS
export interface AnalyticsSummaryQuery {
  start: EventRow["created_at"];
  end: EventRow["created_at"];
}

export interface AnalyticsSummaryDTO {
  dishAdded: { count: number };
  dayPlanned: { count: number };
}
