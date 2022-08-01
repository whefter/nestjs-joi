import * as Joi from 'joi';
import { DEFAULT } from 'joi-class-decorators';

export const JoiValidationGroups = {
  DEFAULT,
  CREATE: Symbol('CREATE'),
  UPDATE: Symbol('UPDATE'),
};

// Convenient & consistency export
export { DEFAULT };
export const CREATE = JoiValidationGroups.CREATE;
export const UPDATE = JoiValidationGroups.UPDATE;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Constructor<T = any> extends Function {
  new (...args: unknown[]): T;
}

export const JOIPIPE_OPTIONS = Symbol('JOIPIPE_OPTIONS');
export class JoiPipeValidationException extends Error {
  constructor(message: string, readonly joiValidationError: Joi.ValidationError) {
    super(message);
  }
}
