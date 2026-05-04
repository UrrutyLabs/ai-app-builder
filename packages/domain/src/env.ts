import { EnvSchema, type Env } from "./env-schema";

let _cached: Env | undefined;

function loadEnv(): Env {
  if (_cached) return _cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  _cached = parsed.data;
  return _cached;
}

/**
 * Lazy env access via Proxy. Validation runs on first property access, not
 * at module load. This lets Next.js's build-time route analysis import the
 * module without env vars set (env values aren't actually accessed during
 * analysis). At runtime, the first read still throws on misconfiguration —
 * functionally equivalent to fail-at-boot, just deferred by one access.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    const value = loadEnv();
    return value[prop as keyof Env];
  },
  has(_target, prop) {
    return prop in loadEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(loadEnv());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(loadEnv(), prop);
  },
});

export type { Env };
