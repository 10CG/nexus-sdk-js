import { NexusError } from './base';
import type { ZodError } from 'zod';

/**
 * Thrown when client-side input validation fails (zod schema).
 * Distinct from the API ValidationError (HTTP 400).
 */
export class InputValidationError extends NexusError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const message = `Validation failed: ${zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    super(message, 'NEXUS_INPUT_VALIDATION_ERROR');
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'InputValidationError';
    this.fieldErrors = zodError.flatten().fieldErrors as Record<string, string[]>;
  }
}
