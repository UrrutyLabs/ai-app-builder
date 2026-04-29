import { z } from "zod";

export const ConventionsSchema = z.object({
  framework: z.string().nullable(),
  language: z.string().nullable(),
  testStack: z.array(z.string()),
  styling: z.array(z.string()),
  orm: z.string().nullable(),
  database: z.string().nullable(),
  formLib: z.array(z.string()),
  validation: z.array(z.string()),
  monorepo: z.string().nullable(),
  tsStrict: z.boolean().nullable(),
  packageManager: z.string().nullable(),
  notes: z.array(z.string()),
});

export type Conventions = z.infer<typeof ConventionsSchema>;

export const EMPTY_CONVENTIONS: Conventions = {
  framework: null,
  language: null,
  testStack: [],
  styling: [],
  orm: null,
  database: null,
  formLib: [],
  validation: [],
  monorepo: null,
  tsStrict: null,
  packageManager: null,
  notes: [],
};
