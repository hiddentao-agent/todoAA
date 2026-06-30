import { describe, it, expect, beforeEach } from 'vitest';
import { announcerMessage, announce } from '@/stores/uiStore.ts';

describe('announce', () => {
  beforeEach(() => {
    announcerMessage.value = '';
  });

  it('sets the announcer message', async () => {
    announce('Task created');
    // Wait for requestAnimationFrame
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task created');
  });

  it('re-triggers for the same message', async () => {
    announce('Task saved');
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task saved');

    // Same message should still work
    announce('Task saved');
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task saved');
  });
});
