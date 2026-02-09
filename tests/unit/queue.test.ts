/**
 * @module tests/unit/queue
 * @description Unit tests for OfflineQueue.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineQueue } from '../../src/http/queue';
import { NexusError } from '../../src/errors/base';

// ---------------------------------------------------------------------------
// OfflineQueue
// ---------------------------------------------------------------------------

describe('OfflineQueue', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    queue = new OfflineQueue(5); // small max for testing
  });

  // -----------------------------------------------------------------------
  // enqueue
  // -----------------------------------------------------------------------

  describe('enqueue', () => {
    it('should return a Promise', () => {
      const promise = queue.enqueue({ method: 'POST', path: '/memories', data: { text: 'hello' } });

      expect(promise).toBeInstanceOf(Promise);
    });

    it('should increase the queue size', () => {
      expect(queue.size).toBe(0);

      queue.enqueue({ method: 'POST', path: '/memories' });

      expect(queue.size).toBe(1);
    });

    it('should reject when the queue is full', async () => {
      // Fill the queue to capacity (maxSize = 5)
      for (let i = 0; i < 5; i++) {
        queue.enqueue({ method: 'POST', path: `/test/${i}` });
      }

      expect(queue.size).toBe(5);

      // The 6th enqueue should reject immediately
      await expect(
        queue.enqueue({ method: 'POST', path: '/overflow' }),
      ).rejects.toThrow(NexusError);
    });

    it('should include NEXUS_QUEUE_FULL code when queue is full', async () => {
      for (let i = 0; i < 5; i++) {
        queue.enqueue({ method: 'POST', path: `/test/${i}` });
      }

      try {
        await queue.enqueue({ method: 'POST', path: '/overflow' });
        // Should not reach here
        expect.unreachable('Expected enqueue to reject');
      } catch (error) {
        expect(error).toBeInstanceOf(NexusError);
        expect((error as NexusError).code).toBe('NEXUS_QUEUE_FULL');
      }
    });
  });

  // -----------------------------------------------------------------------
  // flush
  // -----------------------------------------------------------------------

  describe('flush', () => {
    it('should execute all queued requests and resolve their promises', async () => {
      const results: string[] = [];

      const p1 = queue.enqueue({ method: 'POST', path: '/a', data: { id: 1 } });
      const p2 = queue.enqueue({ method: 'POST', path: '/b', data: { id: 2 } });

      const executor = vi.fn().mockImplementation(async (req) => {
        results.push(req.path);
        return { ok: true, path: req.path };
      });

      await queue.flush(executor);

      expect(executor).toHaveBeenCalledTimes(2);
      expect(results).toEqual(['/a', '/b']);

      // The deferred promises should now be resolved
      await expect(p1).resolves.toEqual({ ok: true, path: '/a' });
      await expect(p2).resolves.toEqual({ ok: true, path: '/b' });
    });

    it('should reject individual promises when executor fails', async () => {
      const p1 = queue.enqueue({ method: 'POST', path: '/fail' });

      const executor = vi.fn().mockRejectedValue(new Error('network down'));

      await queue.flush(executor);

      await expect(p1).rejects.toThrow('network down');
    });

    it('should empty the queue after flush', async () => {
      queue.enqueue({ method: 'GET', path: '/test' });
      expect(queue.size).toBe(1);

      await queue.flush(async () => ({ ok: true }));

      expect(queue.size).toBe(0);
    });

    it('should process requests in FIFO order', async () => {
      const order: string[] = [];

      queue.enqueue({ method: 'POST', path: '/first' });
      queue.enqueue({ method: 'POST', path: '/second' });
      queue.enqueue({ method: 'POST', path: '/third' });

      await queue.flush(async (req) => {
        order.push(req.path);
        return { ok: true };
      });

      expect(order).toEqual(['/first', '/second', '/third']);
    });

    it('should be a no-op when queue is empty', async () => {
      const executor = vi.fn();

      await queue.flush(executor);

      expect(executor).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // clear
  // -----------------------------------------------------------------------

  describe('clear', () => {
    it('should reject all pending promises with NEXUS_QUEUE_CLEARED', async () => {
      const p1 = queue.enqueue({ method: 'POST', path: '/a' });
      const p2 = queue.enqueue({ method: 'POST', path: '/b' });

      queue.clear();

      expect(queue.size).toBe(0);

      // Both promises should be rejected
      await expect(p1).rejects.toThrow('offline queue was cleared');
      await expect(p2).rejects.toThrow('offline queue was cleared');
    });

    it('should reject with NexusError containing NEXUS_QUEUE_CLEARED code', async () => {
      const p1 = queue.enqueue({ method: 'POST', path: '/test' });

      queue.clear();

      try {
        await p1;
        expect.unreachable('Expected promise to reject');
      } catch (error) {
        expect(error).toBeInstanceOf(NexusError);
        expect((error as NexusError).code).toBe('NEXUS_QUEUE_CLEARED');
      }
    });
  });

  // -----------------------------------------------------------------------
  // size
  // -----------------------------------------------------------------------

  describe('size', () => {
    it('should return 0 for an empty queue', () => {
      expect(queue.size).toBe(0);
    });

    it('should reflect the number of enqueued items', () => {
      queue.enqueue({ method: 'GET', path: '/a' });
      queue.enqueue({ method: 'GET', path: '/b' });
      queue.enqueue({ method: 'GET', path: '/c' });

      expect(queue.size).toBe(3);
    });

    it('should return 0 after clear', () => {
      queue.enqueue({ method: 'GET', path: '/a' });
      queue.enqueue({ method: 'GET', path: '/b' });

      queue.clear();

      expect(queue.size).toBe(0);
    });

    it('should return 0 after flush', async () => {
      queue.enqueue({ method: 'GET', path: '/a' });

      await queue.flush(async () => ({ ok: true }));

      expect(queue.size).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// OfflineQueue with default maxSize
// ---------------------------------------------------------------------------

describe('OfflineQueue (default maxSize)', () => {
  it('should default to maxSize of 100', async () => {
    const queue = new OfflineQueue();

    // Enqueue 100 items should succeed
    for (let i = 0; i < 100; i++) {
      queue.enqueue({ method: 'GET', path: `/item/${i}` });
    }

    expect(queue.size).toBe(100);

    // The 101st should fail
    await expect(
      queue.enqueue({ method: 'GET', path: '/overflow' }),
    ).rejects.toThrow(NexusError);
  });
});
