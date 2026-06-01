export type CorsOriginHandler = (
  origin: string | undefined,
  callback: (error: Error | null, allow?: boolean) => void,
) => void;

export function isProductionEnvironment(nodeEnv?: string): boolean {
  return nodeEnv?.trim().toLowerCase() === 'production';
}

export function parseBooleanFlag(
  rawValue: string | undefined,
  defaultValue = false,
): boolean {
  if (!rawValue) {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function parseCsvEnv(rawValue?: string): string[] {
  return (rawValue ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function resolveCorsOrigins(params: {
  nodeEnv?: string;
  rawCorsOrigin?: string;
}): string[] | CorsOriginHandler {
  const configuredOrigins = parseCsvEnv(params.rawCorsOrigin);

  if (isProductionEnvironment(params.nodeEnv)) {
    if (configuredOrigins.length === 0) {
      throw new Error(
        'CORS_ORIGIN is required when NODE_ENV=production.',
      );
    }

    if (configuredOrigins.some((origin) => origin === '*')) {
      throw new Error(
        'CORS_ORIGIN must not contain wildcard origins in production.',
      );
    }

    return configuredOrigins;
  }

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    try {
      const parsed = new URL(origin);
      const hostname = parsed.hostname.toLowerCase();
      const isLocalhost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]';
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';

      callback(null, isLocalhost && isHttp);
    } catch {
      callback(null, false);
    }
  };
}
