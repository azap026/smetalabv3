import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { headers } from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get IP from x-forwarded-for', async () => {
    const mockHeaders = new Map();
    mockHeaders.set('x-forwarded-for', '10.0.0.1, 192.168.1.1');
    (headers as unknown as Mock).mockReturnValue({
      get: (key: string) => mockHeaders.get(key),
    });

    const ip = await getClientIp();
    expect(ip).toBe('10.0.0.1');
  });

  it('should return unknown if no IP found', async () => {
    const mockHeaders = new Map();
    (headers as unknown as Mock).mockReturnValue({
      get: (key: string) => mockHeaders.get(key),
    });

    const ip = await getClientIp();
    expect(ip).toBe('unknown');
  });

  it('should allow requests under limit', () => {
    const key = 'test-ip-1';
    // 5 limit
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 1000)).toBe(true);
    }
  });

  it('should block requests over limit', () => {
    const key = 'test-ip-2';
    const limit = 3;

    // 1
    expect(checkRateLimit(key, limit, 1000)).toBe(true);
    // 2
    expect(checkRateLimit(key, limit, 1000)).toBe(true);
    // 3
    expect(checkRateLimit(key, limit, 1000)).toBe(true);

    // 4 - Blocked
    expect(checkRateLimit(key, limit, 1000)).toBe(false);
  });

  it('should reset after window expires', async () => {
    const key = 'test-ip-3';
    const limit = 1;
    const windowMs = 100;

    // 1
    expect(checkRateLimit(key, limit, windowMs)).toBe(true);
    // 2 - Blocked
    expect(checkRateLimit(key, limit, windowMs)).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should be allowed again
    expect(checkRateLimit(key, limit, windowMs)).toBe(true);
  });
});
