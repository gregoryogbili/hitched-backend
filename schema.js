// schema.js
import { z } from "zod";

/* =========================
   Allowed enums
========================= */
export const RelationshipIntentEnum = z.enum([
  "long_term",
  "marriage",
  "companionship",
  "friendship",
  "hangout",
  "partner_for_event"
]);

export const YesNoIndifferentEnum = z.enum(["yes", "no", "indifferent"]);
export const ChildrenEnum = z.enum(["yes", "no", "open"]);
export const TemperamentEnum = z.enum(["calm", "energetic", "mixed"]);
export const CommunicationStyleEnum = z.enum(["direct", "gentle", "reserved"]);
export const ConflictStyleEnum = z.enum(["calm", "avoidant", "intense", "solution_focused"]);
export const SocialEnergyEnum = z.enum(["low", "medium", "high"]);
export const WeekendPreferenceEnum = z.enum(["quiet", "mixed", "active"]);
export const GroomingEnum = z.enum(["low", "medium", "high"]);
export const StyleEnum = z.enum(["classic", "casual", "trendy", "indifferent"]);

/* =========================
   Profile schemas
   - Draft: allows partial save
   - Complete: requires essentials before matching
========================= */
export const ProfileDraftSchema = z.object({
  age: z.number().int().min(18).max(99).optional(),
  gender_identity: z.string().min(1).max(60).optional(),
  location: z.string().min(2).max(120).optional(),
  distance_km: z.number().int().min(1).max(500).optional(),

  relationship_intent: RelationshipIntentEnum.optional(),

  smoking: YesNoIndifferentEnum.optional(),
  children: ChildrenEnum.optional(),

  temperament: TemperamentEnum.optional(),
  communication_style: CommunicationStyleEnum.optional(),
  conflict_style: ConflictStyleEnum.optional(),
  social_energy: SocialEnergyEnum.optional(),
  weekend_preference: WeekendPreferenceEnum.optional(),

  values: z.array(z.string().min(2).max(30)).max(20).optional(),

  grooming: GroomingEnum.optional(),
  style: StyleEnum.optional(),

  dealbreakers: z.array(z.string().min(2).max(60)).max(30).optional(),

  notes_for_matching: z.string().max(240).optional()
}).strict();

export const ProfileCompleteSchema = ProfileDraftSchema.extend({
  age: z.number().int().min(18).max(99),
  location: z.string().min(2).max(120),
  relationship_intent: RelationshipIntentEnum,
  values: z.array(z.string().min(2).max(30)).min(2).max(20),
  communication_style: CommunicationStyleEnum,
  temperament: TemperamentEnum
}).strict();

/* =========================
   Completeness checker
========================= */
const REQUIRED_FIELDS = [
  "age",
  "location",
  "relationship_intent",
  "values",
  "communication_style",
  "temperament"
];

export function checkProfileCompleteness(profileData) {
  const missing = [];

  for (const key of REQUIRED_FIELDS) {
    const v = profileData?.[key];

    if (v === undefined || v === null) {
      missing.push(key);
      continue;
    }

    if (typeof v === "string" && v.trim() === "") missing.push(key);
    if (Array.isArray(v) && v.length === 0) missing.push(key);
  }

  const complete = missing.length === 0;

  return {
    complete,
    missing,
    required_fields: REQUIRED_FIELDS
  };
}
