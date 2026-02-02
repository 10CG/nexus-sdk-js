/**
 * Vitest global setup
 */

import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock AbortController for timeout tests
global.AbortController = AbortController;

// Mock Request and Response if needed
global.Request = Request as any;
global.Response = Response as any;
