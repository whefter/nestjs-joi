import * as Joi from 'joi';
import { isObject } from 'lodash';

import {
  ClassOptionsMetadata,
  JoiValidationGroup,
  JoiValidationGroups,
  OPTIONS_PROTO_KEY,
} from './defs';

export function JoiSchemaOptions(options: Joi.ValidationOptions): ClassDecorator;
export function JoiSchemaOptions(
  groups: JoiValidationGroup[],
  options: Joi.ValidationOptions,
): ClassDecorator;
export function JoiSchemaOptions(...args: unknown[]): ClassDecorator {
  let options: Joi.ValidationOptions;
  let groups: JoiValidationGroup[] = [];
  if (args.length === 1 && isObject(args[0])) {
    options = args[0] as Joi.ValidationOptions;
  } else if (
    args.length === 2 &&
    args[0] instanceof Array &&
    !args[0].some(x => !['string', 'symbol'].includes(typeof x)) &&
    isObject(args[1])
  ) {
    groups = args[0] as JoiValidationGroup[];
    options = args[1] as Joi.ValidationOptions;
  } else {
    throw new Error('Invalid arguments.');
  }

  try {
    Joi.string().options(options);
  } catch (error) {
    error.message = `Invalid Joi.ValidationOptions: ${error.message}`;
    throw error;
  }

  return function (target: Function): void {
    // Get existing meta, if applicable, set options for each passed group,
    // throw if options for group already set
    const optionsMeta: ClassOptionsMetadata =
      Reflect.getOwnMetadata(OPTIONS_PROTO_KEY, target) || new Map();

    const finalGroups: Array<string | symbol> = groups.length
      ? groups
      : [JoiValidationGroups.DEFAULT];

    for (const group of finalGroups) {
      if (optionsMeta.has(group)) {
        throw new Error(
          `Cannot redefine schema options for group ${String(group)} on ${target.constructor.name}`,
        );
      }

      optionsMeta.set(group, options);
    }

    Reflect.defineMetadata(OPTIONS_PROTO_KEY, optionsMeta, target);
  };
}
