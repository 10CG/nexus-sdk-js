/**
 * Base service class
 */

import { HttpClient } from '../http';

/**
 * Abstract base class for all services
 */
export abstract class BaseService {
  /** HTTP client instance */
  protected readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }
}
