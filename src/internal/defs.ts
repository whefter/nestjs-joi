import * as Joi from 'joi';

export type JoiValidationGroup = string | symbol;

export const JoiValidationGroups = {
  DEFAULT: Symbol('DEFAULT_GROUP'),
  CREATE: Symbol('CREATE'),
  UPDATE: Symbol('UPDATE'),
};

export const DEFAULT = JoiValidationGroups.DEFAULT;
export const CREATE = JoiValidationGroups.CREATE;
export const UPDATE = JoiValidationGroups.UPDATE;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Constructor<T = any> extends Function {
  new (...args: unknown[]): T;
}

export const OPTIONS_PROTO_KEY = Symbol('JOIPIPE_OPTIONS_PROTO_KEY');
export type ClassOptionsMetadata = Map<string | symbol, Joi.ValidationOptions>;

export const SCHEMA_PROTO_KEY = Symbol('JOIPIPE_SCHEMA_PROTO_KEY');
export const SCHEMA_PROP_KEY = Symbol('JOIPIPE_SCHEMA_PROP_KEY');
export type SchemaCustomizerFn = (schema: Joi.Schema) => Joi.Schema;
export type PropertySchemaMetadata = Map<
  string | symbol,
  {
    schemaOrType: Joi.Schema | Constructor | Constructor[];
    schemaFn?: SchemaCustomizerFn;
  }
>;
