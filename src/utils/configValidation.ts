import { z } from 'zod';
import type { Environment, LogLevel, LogFormat } from '../client/utils/setupEnv';

// Basic environment validation schema
const environmentSchema = z.enum(['development', 'staging', 'production', 'test']);
const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);
const logFormatSchema = z.enum(['detailed', 'json', 'simple']);

// Port validation schema
const portSchema = z.object({
  frontend: z.number().int().min(1).max(65535),
  api: z.number().int().min(1).max(65535),
  external: z.number().int().min(1).max(65535),
});

// WebSocket configuration schema
const wsConfigSchema = z.object({
  protocol: z.enum(['ws', 'wss']),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  reconnect: z.object({
    maxRetries: z.number().int().min(1),
    minDelay: z.number().int().min(100),
    maxDelay: z.number().int().min(1000),
    timeout: z.number().int().min(1000),
  }),
});

// API configuration schema
const apiConfigSchema = z.object({
  protocol: z.enum(['http', 'https']),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  baseUrl: z.string(),
  timeout: z.number().int().min(1000),
  retryAttempts: z.number().int().min(1),
  rateLimiting: z.object({
    enabled: z.boolean(),
    maxRequests: z.number().int().min(1),
    timeWindow: z.number().int().min(1000),
  }).optional(),
});

// Object storage configuration schema
const objectStorageSchema = z.object({
  baseUrl: z.string(),
  maxFileSize: z.number().int().min(1),
  allowedTypes: z.array(z.string()),
  cacheDuration: z.number().int().min(0),
  retryAttempts: z.number().int().min(1),
  uploadConfig: z.object({
    chunkSize: z.number().int().min(1024),
    concurrency: z.number().int().min(1),
    timeout: z.number().int().min(1000),
  }),
});

// Logging configuration schema
const loggingSchema = z.object({
  level: logLevelSchema,
  format: logFormatSchema,
  timestamp: z.boolean(),
  console: z.boolean(),
  file: z.boolean(),
  maxFiles: z.number().int().min(1).optional(),
  maxSize: z.number().int().min(1024).optional(),
  remoteLogging: z.object({
    enabled: z.boolean(),
    endpoint: z.string().url().optional(),
    batchSize: z.number().int().min(1).optional(),
    flushInterval: z.number().int().min(1000).optional(),
  }).optional(),
});

// Cache configuration schema
const cacheSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number().int().min(1),
  maxSize: z.number().int().min(1),
  strategy: z.enum(['lru', 'fifo']),
  redis: z.object({
    enabled: z.boolean(),
    host: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    password: z.string().optional(),
  }).optional(),
});

// Security configuration schema
const securitySchema = z.object({
  cors: z.object({
    enabled: z.boolean(),
    origins: z.array(z.string()),
    methods: z.array(z.string()),
    credentials: z.boolean(),
    maxAge: z.number().int().optional(),
  }),
  rateLimit: z.object({
    enabled: z.boolean(),
    maxRequests: z.number().int().min(1),
    windowMs: z.number().int().min(1000),
    errorMessage: z.string().optional(),
  }),
  csrf: z.object({
    enabled: z.boolean(),
    ignoreMethods: z.array(z.string()),
    cookieOptions: z.object({
      secure: z.boolean(),
      sameSite: z.enum(['strict', 'lax', 'none']),
    }).optional(),
  }),
  headers: z.object({
    hsts: z.boolean(),
    noSniff: z.boolean(),
    xssProtection: z.boolean(),
    frameOptions: z.enum(['DENY', 'SAMEORIGIN', 'ALLOW-FROM']),
  }),
});

// Features configuration schema
const featuresSchema = z.object({
  multitenant: z.boolean(),
  analytics: z.boolean(),
  websockets: z.boolean(),
  objectStorage: z.boolean(),
  caching: z.boolean(),
  compression: z.boolean(),
  monitoring: z.boolean(),
});

// Monitoring configuration schema
const monitoringSchema = z.object({
  enabled: z.boolean(),
  metrics: z.object({
    collection: z.boolean(),
    endpoint: z.string().optional(),
    interval: z.number().int().min(1000),
  }),
  tracing: z.object({
    enabled: z.boolean(),
    samplingRate: z.number().min(0).max(1),
  }),
  healthCheck: z.object({
    enabled: z.boolean(),
    interval: z.number().int().min(1000),
    timeout: z.number().int().min(1000),
  }),
});

// Main configuration schema
export const configSchema = z.object({
  NODE_ENV: environmentSchema,
  isDev: z.boolean(),
  isProduction: z.boolean(),
  isStaging: z.boolean(),
  isTest: z.boolean(),
  host: z.string().min(1),
  ports: portSchema,
  ws: wsConfigSchema,
  api: apiConfigSchema,
  objectStorage: objectStorageSchema,
  logging: loggingSchema,
  cache: cacheSchema,
  security: securitySchema,
  features: featuresSchema,
  monitoring: monitoringSchema,
});

export type ValidatedConfig = z.infer<typeof configSchema>;

export function validateConfig(config: unknown): ValidatedConfig {
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Config Validation] Invalid configuration:', {
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
}

export function validateEnvironment(env: unknown): Environment {
  return environmentSchema.parse(env);
}

export function validateLogLevel(level: unknown): LogLevel {
  return logLevelSchema.parse(level);
}

export function validateLogFormat(format: unknown): LogFormat {
  return logFormatSchema.parse(format);
}
