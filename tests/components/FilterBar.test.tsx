import { describe, it, expect, beforeEach } from 'vitest';
import { activeFilter } from '@/stores/uiStore.ts';

describe('FilterBar logic', () => {
  beforeEach(() => {
    activeFilter.value = 'all';
  });

  it('setFilter changes activeFilter', () => {
    expect(activeFilter.value).toBe('all');
    activeFilter.value = 'active';
    expect(activeFilter.value).toBe('active');
    activeFilter.value = 'completed';
    expect(activeFilter.value).toBe('completed');
  });
});
