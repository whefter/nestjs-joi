/* eslint-disable @typescript-eslint/unified-signatures */ // Unified signatures are harder to read

import * as Joi from 'joi';
import { intersection } from 'lodash';

import {
  Constructor,
  JoiValidationGroup,
  JoiValidationGroups,
  PropertySchemaMetadata,
  SCHEMA_PROP_KEY,
  SCHEMA_PROTO_KEY,
  SchemaCustomizerFn,
} from './defs';

export function JoiSchema(schema: Joi.Schema): PropertyDecorator;
export function JoiSchema(
  nestedType: Constructor,
  customizeSchemaFn?: SchemaCustomizerFn,
): PropertyDecorator;
export function JoiSchema(
  nestedTypeArray: Constructor[],
  customizeArraySchemaFn?: SchemaCustomizerFn | null,
  customizeSchemaFn?: SchemaCustomizerFn,
): PropertyDecorator;
export function JoiSchema(groups: JoiValidationGroup[], schema: Joi.Schema): PropertyDecorator;
export function JoiSchema(
  groups: JoiValidationGroup[],
  nestedType: Constructor,
  customizeSchemaFn?: SchemaCustomizerFn,
): PropertyDecorator;
export function JoiSchema(
  groups: JoiValidationGroup[],
  nestedTypeArray: Constructor[],
  customizeArraySchemaFn?: SchemaCustomizerFn | null,
  customizeSchemaFn?: SchemaCustomizerFn,
): PropertyDecorator;
export function JoiSchema(...args: unknown[]): PropertyDecorator {
  let schema: Joi.Schema | undefined;
  let nestedType: Constructor | Constructor[] | undefined;
  let customizeArraySchemaFn: SchemaCustomizerFn | undefined | null;
  let customizeSchemaFn: SchemaCustomizerFn | undefined;
  let groups: JoiValidationGroup[] = [];

  if (Joi.isSchema(args[0])) {
    schema = args[0] as Joi.Schema;
  } else if (typeof args[0] === 'function') {
    nestedType = args[0] as Constructor;
    customizeSchemaFn = args[1] as SchemaCustomizerFn | undefined;
  } else if (args[0] instanceof Array && !args[0].some(x => typeof x !== 'function')) {
    nestedType = args[0] as Constructor[];
    customizeArraySchemaFn = args[1] as SchemaCustomizerFn | undefined | null;
    customizeSchemaFn = args[2] as SchemaCustomizerFn | undefined;
  } else if (
    args[0] instanceof Array &&
    !args[0].some(x => !['string', 'symbol'].includes(typeof x))
  ) {
    groups = args[0] as JoiValidationGroup[];

    if (Joi.isSchema(args[1])) {
      schema = args[1] as Joi.Schema;
    } else if (typeof args[1] === 'function') {
      nestedType = args[1] as Constructor;
      customizeSchemaFn = args[2] as SchemaCustomizerFn | undefined;
    } else if (args[1] instanceof Array && !args[1].some(x => typeof x !== 'function')) {
      nestedType = args[1] as Constructor[];
      customizeArraySchemaFn = args[2] as SchemaCustomizerFn | undefined;
      customizeSchemaFn = args[3] as SchemaCustomizerFn | undefined;
    } else {
      throw new Error(`Invalid arguments.`);
    }
  } else {
    throw new Error(`Invalid arguments.`);
  }

  return function (target: typeof Object.prototype, propertyKey: string | symbol): void {
    if (typeof propertyKey === 'symbol') {
      // These are not supported by Joi anyway.
      throw new Error(`Invalid target property (symbol).`);
    }

    const protoList: string[] = Reflect.getOwnMetadata(SCHEMA_PROTO_KEY, target) || [];
    protoList.push(propertyKey);
    Reflect.defineMetadata(
      SCHEMA_PROTO_KEY,
      // "unique values"
      intersection(protoList, protoList),
      target,
    );

    // Get existing meta, if applicable, set schema for each passed group, throw if schema for group
    // already set
    const propMeta: PropertySchemaMetadata =
      Reflect.getOwnMetadata(SCHEMA_PROP_KEY, target, propertyKey) || new Map();

    const finalGroups: Array<string | symbol> = groups.length
      ? groups
      : [JoiValidationGroups.DEFAULT];

    for (const group of finalGroups) {
      if (propMeta.has(group)) {
        throw new Error(
          `Cannot redefine schema for group ${String(group)} on ${
            target.constructor.name
          }::${propertyKey}`,
        );
      }

      if (schema) {
        propMeta.set(group, {
          schemaOrType: schema,
        });
      } else {
        /* istanbul ignore else */ // else case prevented by type checking on arguments
        if (nestedType) {
          propMeta.set(group, {
            schemaOrType: nestedType,
            schemaFn: customizeSchemaFn,
            schemaArrayFn: customizeArraySchemaFn,
          });
        }
      }
    }

    Reflect.defineMetadata(SCHEMA_PROP_KEY, propMeta, target, propertyKey);
  };
}
