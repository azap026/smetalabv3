import { cn } from './utils';
import { expect, test } from 'vitest';

test('cn combines class names correctly', () => {
  expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
});
