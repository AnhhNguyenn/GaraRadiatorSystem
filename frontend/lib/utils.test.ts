// import { describe, it, expect } from 'vitest';

import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge basic class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle falsy values (clsx behavior)', () => {
    expect(cn('class1', null, undefined, false, '', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes (clsx behavior)', () => {
    expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
  });

  it('should handle arrays (clsx behavior)', () => {
    expect(cn(['class1', 'class2'], ['class3'])).toBe('class1 class2 class3');
  });

  it('should resolve tailwind class conflicts (twMerge behavior)', () => {
    expect(cn('p-4 p-8')).toBe('p-8');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should combine clsx and twMerge behaviors', () => {
    expect(cn(
      'p-4 text-red-500',
      { 'p-8': true, 'text-blue-500': false },
      ['bg-gray-100', 'bg-gray-200']
    )).toBe('text-red-500 p-8 bg-gray-200');
  });
});
