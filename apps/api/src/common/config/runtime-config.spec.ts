import {
  parseBooleanFlag,
  parseCsvEnv,
  resolveCorsOrigins,
} from './runtime-config';

describe('runtime config helpers', () => {
  it('accepts comma-separated CORS origins in production', () => {
    expect(
      resolveCorsOrigins({
        nodeEnv: 'production',
        rawCorsOrigin: 'https://staging.example.com, https://app.example.com',
      }),
    ).toEqual([
      'https://staging.example.com',
      'https://app.example.com',
    ]);
  });

  it('throws when production CORS_ORIGIN is missing', () => {
    expect(() =>
      resolveCorsOrigins({
        nodeEnv: 'production',
        rawCorsOrigin: undefined,
      }),
    ).toThrow('CORS_ORIGIN is required');
  });

  it('allows localhost origins by default in development', () => {
    const resolver = resolveCorsOrigins({
      nodeEnv: 'development',
      rawCorsOrigin: undefined,
    });

    expect(typeof resolver).toBe('function');

    const callback = jest.fn();
    (resolver as (origin: string | undefined, callback: jest.Mock) => void)(
      'http://localhost:7357',
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects wildcard CORS origins in production', () => {
    expect(() =>
      resolveCorsOrigins({
        nodeEnv: 'production',
        rawCorsOrigin: '*',
      }),
    ).toThrow('wildcard');
  });

  it('parses explicit boolean feature flags', () => {
    expect(parseBooleanFlag('true')).toBe(true);
    expect(parseBooleanFlag('false', true)).toBe(false);
  });

  it('parses comma-separated identifiers safely', () => {
    expect(parseCsvEnv(' user-1, user-2 ,,user-3 ')).toEqual([
      'user-1',
      'user-2',
      'user-3',
    ]);
  });
});
