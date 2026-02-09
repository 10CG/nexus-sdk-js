/**
 * @module errors
 * @description Unified re-export of all Nexus SDK error classes.
 *
 * @example
 * ```typescript
 * import {
 *   NexusError,
 *   ApiError,
 *   AuthenticationError,
 *   RateLimitError,
 *   ValidationError,
 *   NotFoundError,
 *   ConfigurationError,
 *   NetworkError,
 *   TimeoutError,
 * } from '@nexus/sdk';
 * ```
 */

// Base errors
export {
  NexusError,
  ConfigurationError,
  NetworkError,
  TimeoutError,
} from './base';

// API errors
export {
  ApiError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
} from './api';
