/* eslint-disable @typescript-eslint/unified-signatures */ // Unified signatures are harder to read

import * as Joi from 'joi';
import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { reverse } from 'lodash';

import {
  ClassOptionsMetadata,
  Constructor,
  JoiValidationGroup,
  JoiValidationGroups,
  OPTIONS_PROTO_KEY,
  PropertySchemaMetadata,
  SchemaCustomizerFn,
  SCHEMA_PROP_KEY,
  SCHEMA_PROTO_KEY,
} from './defs';

interface JoiPipeOptions {
  group?: JoiValidationGroup;
}
const JoiPipeOptionsSchema = Joi.object().keys({
  group: Joi.alternatives(Joi.string(), Joi.symbol()).optional(),
});

const DEFAULT_JOI_OPTS: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
};

@Injectable({ scope: Scope.REQUEST })
export class JoiPipe implements PipeTransform {
  private readonly schema?: Joi.Schema;
  private readonly type?: Constructor;
  private readonly group?: JoiValidationGroup;
  private readonly method?: string;

  constructor();
  constructor(pipeOpts?: JoiPipeOptions);
  constructor(type: Constructor, pipeOpts?: JoiPipeOptions);
  constructor(schema: Joi.Schema, pipeOpts?: JoiPipeOptions);
  constructor(
    @Inject(REQUEST) private readonly request?: unknown,
    @Optional() pipeOpts?: JoiPipeOptions,
  ) {
    if (request) {
      // Test for an actual request object, which indicates we're in "injected" mode.
      // This is the case that requires the most performant handling, which is why it
      // should be the first branch.
      // TODO Check if there is a more efficient/reliable test for generic request objects
      if ('method' in (request as {}) && 'headers' in (request as {})) {
        this.method = (request as { method: string }).method;
      } else {
        // This is the "manually called constructor" case, where performance is
        // (ostensibly) not as big of a concern since manual JoiPipes will be
        // constructed only once at app initialization
        if (Joi.isSchema(request)) {
          this.schema = request as Joi.Schema;
        } else if (typeof request === 'function') {
          this.type = request as Constructor;
        } else {
          pipeOpts = request as JoiPipeOptions;
        }

        pipeOpts = pipeOpts || {};

        try {
          pipeOpts = Joi.attempt(pipeOpts, JoiPipeOptionsSchema.required()) as JoiPipeOptions;
        } catch (error) {
          error.message = `Invalid JoiPipeOptions: ${error.message}`;
          throw error;
        }

        this.group = pipeOpts.group;
      }
    } else {
      // Called without arguments, do nothing
    }
  }

  transform(payload: unknown, metadata: ArgumentMetadata): unknown {
    const schema = this.getSchema(metadata);

    if (!schema) {
      // This happens when a metatype was passed by NestJS and it has no
      // validation decoration.
      return payload;
    }

    return JoiPipe.transform(payload, schema, metadata);
  }

  private static transform<T>(
    payload: unknown,
    schema: Joi.Schema,
    metadata: ArgumentMetadata = { type: 'custom' },
  ): T {
    const { error, value } = schema.validate(
      payload,
      // This will always get overridden by whatever options have been specified
      // on the schema itself
      DEFAULT_JOI_OPTS,
    );

    if (error) {
      // Provide a special response with reasons
      const reasons = error.details.map((detail: { message: string }) => detail.message).join(', ');
      throw new BadRequestException(
        `Request validation of ${metadata.type} ` +
          (metadata.data ? `item '${metadata.data}' ` : '') +
          `failed, because: ${reasons}`,
      );
    }

    // Everything is fine
    return value as T;
  }

  /**
   * Determine what schema to return/construct based on the actual metadata
   * passed for this request.
   *
   * @param metadata
   */
  private getSchema(metadata: ArgumentMetadata): Joi.Schema | undefined {
    // If called in request scope mode, give preference to this mode.
    if (this.method && metadata.metatype) {
      let group: JoiValidationGroup | undefined;
      if (this.method === 'PUT' || this.method === 'PATCH') {
        group = JoiValidationGroups.UPDATE;
      } else if (this.method === 'POST') {
        group = JoiValidationGroups.CREATE;
      }

      return JoiPipe.getTypeSchema(metadata.metatype, { group });
    }

    // Prefer a static schema, if specified
    if (this.schema) {
      return this.schema;
    }

    // Prefer a static model, if specified
    if (this.type) {
      // Don't return "no schema" (undefined) if a type was explicitely specified
      return JoiPipe.getTypeSchema(this.type, { forced: true, group: this.group });
    }

    // Determine the schema from the passed model
    if (metadata.metatype) {
      return JoiPipe.getTypeSchema(metadata.metatype, { group: this.group });
    }

    return undefined;
  }

  /**
   * Cache map for already constructed schemas
   */
  private static readonly typeSchemaMap = new Map<unknown, Map<string, Joi.Schema | undefined>>();

  /**
   * Construct a schema based on a passed type (Constructor). Metadata set using
   * the decorators for properties (schema keys) and class  (schema options) is
   * be read from the whole prototype chain. The result is cached for better performance,
   * using the type and options to construct a cache key.
   *
   * If no properties have been decorated in the whole chain, no schema
   * will be returned so as to not throw when inadvertently "validating" using
   * inbuilt types.
   * Returning a schema can be forced to cover cases when a type has been explicitely
   * passed to JoiPipe.
   *
   * @param type
   * @param forced
   */
  private static getTypeSchema(
    type: Constructor,
    { forced, group }: { forced?: boolean; group?: JoiValidationGroup } = {},
  ): Joi.Schema | undefined {
    // Do not validate basic inbuilt types
    if (type === String || type === Object || type === Number || type === Array) {
      return;
    }

    const cacheKey = 'forced' + (forced ? '1' : '0') + (group ? 'group' + String(group) : '');

    // Check cache.
    if (this.typeSchemaMap.has(type)) {
      if (this.typeSchemaMap.get(type)?.has(cacheKey)) {
        return this.typeSchemaMap.get(type)?.get(cacheKey);
      }
    } else {
      this.typeSchemaMap.set(type, new Map());
    }

    const protoChain: Array<typeof Object.prototype> = [];

    // Get all prototypes in the chain, resulting in an array with the prototype
    // that is closest to Object as the last element
    let currentProto = type.prototype;
    do {
      protoChain.push(currentProto);
      currentProto = Object.getPrototypeOf(currentProto);
    } while (currentProto !== Object.prototype);

    // Loop through all prototypes to get their property schemas, beginning with
    // the one closest to Object, so that parent property schemas get overridden
    // by child property schemas.
    // Schema options are also assigned in that order.
    const props: string[] = [];
    const schemas: { [key: string]: Joi.Schema } = {};
    const options: Joi.ValidationOptions = {};
    for (const proto of reverse(protoChain)) {
      // Check for options information on proto
      const optionsMeta: ClassOptionsMetadata | undefined = Reflect.getMetadata(
        OPTIONS_PROTO_KEY,
        proto,
      );
      // Decorator was used to specify options on this proto
      if (optionsMeta) {
        let protoOptions: Joi.ValidationOptions = {};
        if (group && optionsMeta.has(group)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          protoOptions = optionsMeta.get(group)!;
        } else if (optionsMeta.has(JoiValidationGroups.DEFAULT)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          protoOptions = optionsMeta.get(JoiValidationGroups.DEFAULT)!;
        }

        if (protoOptions) {
          Object.assign(options, protoOptions);
        }
      }

      // Check for property information on proto
      const protoProps: string[] = Reflect.getMetadata(SCHEMA_PROTO_KEY, proto) || [];
      for (const prop of protoProps) {
        const propMeta: PropertySchemaMetadata = Reflect.getMetadata(SCHEMA_PROP_KEY, proto, prop);

        // Ignore property if not part of designated validation group
        let schemaOrType: Joi.Schema | Constructor | Constructor[];
        let schemaFn: SchemaCustomizerFn | undefined;
        if (group && propMeta.has(group)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ({ schemaOrType, schemaFn } = propMeta.get(group)!);
        } else if (propMeta.has(JoiValidationGroups.DEFAULT)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ({ schemaOrType, schemaFn } = propMeta.get(JoiValidationGroups.DEFAULT)!);
        } else {
          continue;
        }

        props.push(prop);

        if (Joi.isSchema(schemaOrType)) {
          schemas[prop] = schemaOrType as Joi.Schema;
        } else if (typeof schemaOrType === 'function') {
          schemas[prop] = this.getTypeSchema(schemaOrType as Constructor, {
            forced,
            group,
          }) as Joi.Schema;
        } else if (schemaOrType instanceof Array) {
          const schema = this.getTypeSchema(schemaOrType[0], {
            forced,
            group,
          }) as Joi.Schema;

          schemas[prop] = Joi.array().items(schema);
          if (schemaFn) {
            schemas[prop] = schemaFn(schemas[prop]);
          }
        }
      }
    }

    // The default behavior when no properties have attached schemas is to not
    // validate, otherwise we'd get errors for types with no decorators not intended
    // to be validated when used as global pipe
    if (!props.length && !forced) {
      this.typeSchemaMap.get(type)?.set(cacheKey, undefined);
      return undefined;
    }

    const fullSchema = Joi.object().keys(schemas).required().options(options);

    // Cache value
    this.typeSchemaMap.get(type)?.set(cacheKey, fullSchema);

    return fullSchema;
  }
}
