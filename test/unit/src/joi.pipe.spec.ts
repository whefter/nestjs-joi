/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import { BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';
import { JoiSchema, JoiSchemaOptions } from 'joi-class-decorators';

import { CREATE, JoiPipe, JoiPipeValidationException, UPDATE } from '../../../src';

class metatype {
  @JoiSchema(Joi.number().required())
  prop!: number;

  @JoiSchema(Joi.number().optional())
  prop2!: number;
}
const metatypeSchema = Joi.object()
  .keys({
    prop: Joi.number().required(),
    prop2: Joi.number().optional(),
  })
  .options({
    abortEarly: false,
    allowUnknown: true,
  });

class CustomError extends Error {}
class errorMetatype {
  @JoiSchema(Joi.string().alphanum().error(new CustomError('custom message')))
  prop!: string;
}

@JoiSchemaOptions({
  allowUnknown: false,
})
class emptyType {}

const NATIVE_TYPES = [String, Object, Number, Array];

describe('JoiPipe', () => {
  describe('arguments', () => {
    function accept(what: string, ...args: unknown[]) {
      it(`should accept (${what})`, () => {
        let error;
        try {
          // @ts-ignore
          new JoiPipe(...args);
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });
    }
    function reject(what: string, withMessage: string, ...args: unknown[]) {
      it(`should reject (${what})`, () => {
        try {
          // @ts-ignore
          new JoiPipe(...args);
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(withMessage);
        }
      });
    }

    class type {}

    accept('');
    accept('JoiPipeOptions', { group: 'group' });
    reject('INVALID JoiPipeOptions', 'Invalid JoiPipeOptions', { invalid: true });
    accept('ClassType', type);
    accept('ClassType, JoiPipeOptions', type, { group: 'group' });
    reject('ClassType, INVALID JoiPipeOptions', 'Invalid JoiPipeOptions', type, { invalid: true });
    accept('Joi.Schema', Joi.string());
    accept('Joi.Schema, JoiPipeOptions', Joi.string(), { group: 'group' });
    reject('Joi.Schema, INVALID JoiPipeOptions', 'Invalid JoiPipeOptions', Joi.string(), {
      invalid: true,
    });
    accept('HTTP Request', { method: 'get' });
    accept('GraphQL Request', { req: { method: 'get' } });

    describe('(pipe options)', () => {
      accept('{ group: string }', { group: 'group' });
      accept('{ group: symbol }', { group: Symbol('group') });
      reject('{ group: boolean }', 'Invalid JoiPipeOptions', { group: true });
      accept('{ usePipeValidationException: boolean }', { usePipeValidationException: true });
      reject('{ usePipeValidationException: string }', 'Invalid JoiPipeOptions', {
        usePipeValidationException: '1',
      });
      accept('{ skipErrorFormatting: boolean }', { skipErrorFormatting: true });
      reject('{ skipErrorFormatting: string }', 'Invalid JoiPipeOptions', {
        skipErrorFormatting: '1',
      });
    });
  });

  it('should not touch a payload if given nothing to construct a schema', async () => {
    const pipe = new JoiPipe();

    const payload = { prop: 'value' };

    const returnVal = pipe.transform(payload, { type: 'query' });
    expect(returnVal).toBe(payload);
  });

  describe('constructed without schema (pure metatype, no request)', () => {
    describe('transform()', () => {
      it('should run validation on a passed payload', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "value" must be of type object',
          );
        }
      });

      it('should throw a BadRequestException on fail', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform({}, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBe(true);
        }
      });

      it('should throw an error with a message containing all the details from Joi', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform({}, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "prop" is required',
          );
        }
      });

      it('should use the "data" field from metadata in error message, if passed', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform(1, { type: 'query', data: 'foo', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(`Request validation of query item 'foo' failed`);
        }
      });

      it('should transform transformable payloads', async () => {
        const pipe = new JoiPipe();

        const returnVal = pipe.transform({ prop: '1' }, { type: 'query', metatype });

        expect(returnVal).toEqual({ prop: 1 });
      });

      it('should not throw an error for transformable payloads', async () => {
        const pipe = new JoiPipe();

        let error;
        try {
          pipe.transform({ prop: '1' }, { type: 'query', metatype });
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      it('should throw a Nest BadRequestException if not configured otherwise', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBeTruthy();
        }
      });

      it('should throw a Nest BadRequestException when configured explicitely', async () => {
        const pipe = new JoiPipe({ usePipeValidationException: false });

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBeTruthy();
        }
      });

      it('should throw a JoiPipeValidationException when configured explicitely', async () => {
        const pipe = new JoiPipe({ usePipeValidationException: true });

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof JoiPipeValidationException).toBeTruthy();
        }
      });

      it('should throw a custom error defined in the schema', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform({ prop: '-' }, { type: 'query', metatype: errorMetatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toBe('custom message');
          expect(error instanceof CustomError).toBeTruthy();
        }
      });

      it('should format error when configured explicitly', async () => {
        const pipe = new JoiPipe({ skipErrorFormatting: false });

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('Request validation of');
        }
      });

      it('should not format error when configured explicitly', async () => {
        const pipe = new JoiPipe({ skipErrorFormatting: true });

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).not.toContain('Request validation of');
        }
      });

      it('should format error when not configured explicitly', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('Request validation of');
        }
      });

      it('should throw a JoiPipeValidationException but not format error when configured explicitly', async () => {
        const pipe = new JoiPipe({ skipErrorFormatting: true, usePipeValidationException: true });

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).not.toContain('Request validation of');
          expect(error instanceof JoiPipeValidationException).toBeTruthy();
        }
      });

      it('should use the default JoiValidationOptions if none have been specified in the pipe options', async () => {
        const pipe = new JoiPipe({});

        // Unknown property to test the default setting of "allowUnknown: true"
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query', metatype });
        expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
      });

      it('should use the default JoiValidationOptions if undefined was passed in the pipe options', async () => {
        const pipe = new JoiPipe({
          defaultValidationOptions: undefined,
        });

        // Unknown property to test the default setting of "allowUnknown: true"
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query', metatype });
        expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
      });

      it('should use the JoiValidationOptions passed in the pipe options', async () => {
        const pipe = new JoiPipe({
          defaultValidationOptions: {
            stripUnknown: true,
          },
        });

        // unknownProp should be stripped
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query', metatype });
        expect(returnVal).toEqual({ prop: 1 });
      });

      it('should partially override the default JoiValidationOptions', async () => {
        // Overrides the default value "allowUnknown = true", but leaves "abortEarly = false"
        const pipe = new JoiPipe({
          defaultValidationOptions: {
            allowUnknown: false,
          },
        });

        try {
          // Should produce two errors, one for the incorrect type of "prop" and one for the unknown property
          pipe.transform({ prop: 'a', unknownProp: 1 }, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toBe(
            'Request validation of query failed, because: "prop" must be a number, "unknownProp" is not allowed',
          );
        }
      });

      it('should NOT validate when given a type with no decorated properties', async () => {
        const pipe = new JoiPipe();

        let error;
        try {
          pipe.transform({ prop: 'value' }, { type: 'query', metatype: emptyType });
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      for (const nativeType of NATIVE_TYPES) {
        it('should NOT validate when given an inbuilt type', async () => {
          const pipe = new JoiPipe();

          let error;
          try {
            pipe.transform(undefined, { type: 'query', metatype: nativeType });
          } catch (error_) {
            error = error_;
          }

          expect(error).toBeUndefined();
        });
      }
    });
  });

  describe('constructed with schema', () => {
    describe('transform()', () => {
      it('should run validation on a passed payload', async () => {
        const pipe = new JoiPipe(Joi.string());

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "value" must be a string',
          );
        }
      });

      it('should throw a BadRequestException on fail', async () => {
        const pipe = new JoiPipe(Joi.string());

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBe(true);
        }
      });

      it('should throw an error with a message containing all the details from Joi', async () => {
        const pipe = new JoiPipe(
          Joi.object().keys({
            one: Joi.string().required(),
            two: Joi.string().required(),
          }),
        );

        try {
          pipe.transform({}, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "one" is required, "two" is required',
          );
        }
      });

      it('should use the "data" field from metadata in error message, if passed', async () => {
        const pipe = new JoiPipe(Joi.string());

        try {
          pipe.transform(1, { type: 'query', data: 'foo' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(`Request validation of query item 'foo' failed`);
        }
      });

      it('should transform transformable payloads', async () => {
        const pipe = new JoiPipe(Joi.number());

        const returnVal = pipe.transform('1', { type: 'query' });

        expect(returnVal).toEqual(1);
      });

      it('should not throw an error for transformable payloads', async () => {
        const pipe = new JoiPipe(Joi.number());

        let error;
        try {
          pipe.transform('1', { type: 'query' });
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      it('should throw a Nest BadRequestException if not configured otherwise', async () => {
        const pipe = new JoiPipe(Joi.string());

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBeTruthy();
        }
      });

      it('should throw a Nest BadRequestException when configured explicitly', async () => {
        const pipe = new JoiPipe(Joi.string(), { usePipeValidationException: false });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBeTruthy();
        }
      });

      it('should throw a JoiPipeValidationException when configured explicitly', async () => {
        const pipe = new JoiPipe(Joi.string(), { usePipeValidationException: true });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof JoiPipeValidationException).toBeTruthy();
        }
      });

      it('should throw a custom error defined in the schema', async () => {
        const pipe = new JoiPipe(Joi.string().alphanum().error(new CustomError('custom message')));

        try {
          pipe.transform('-', { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toBe('custom message');
          expect(error instanceof CustomError).toBeTruthy();
        }
      });

      it('should format error when configured explicitly', async () => {
        const pipe = new JoiPipe(Joi.string(), { skipErrorFormatting: false });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('Request validation of');
        }
      });

      it('should not format error when configured explicitely', async () => {
        const pipe = new JoiPipe(Joi.string(), { skipErrorFormatting: true });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).not.toContain('Request validation of');
        }
      });

      it('should throw a JoiPipeValidationException but not format error when configured explicitely', async () => {
        const pipe = new JoiPipe(Joi.string(), {
          skipErrorFormatting: true,
          usePipeValidationException: true,
        });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).not.toContain('Request validation of');
        }
      });

      it('should use the default JoiValidationOptions if none have been specified in the pipe options', async () => {
        const pipe = new JoiPipe(metatypeSchema);

        // Unknown property to test the default setting of "allowUnknown: true"
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query' });
        expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
      });

      it('should use the default JoiValidationOptions if undefined was passed in the pipe options', async () => {
        const pipe = new JoiPipe(metatypeSchema, {
          defaultValidationOptions: undefined,
        });

        // Unknown property to test the default setting of "allowUnknown: true"
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query' });
        expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
      });

      it('should use the JoiValidationOptions passed in the pipe options', async () => {
        const pipe = new JoiPipe(metatypeSchema, {
          defaultValidationOptions: {
            stripUnknown: true,
          },
        });

        // unknownProp should be stripped
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query' });
        expect(returnVal).toEqual({ prop: 1 });
      });

      it('should not be possible to override explicit schema JoiValidationOptions in the JoiPipeOptions', async () => {
        // Attempt to override the default value "allowUnknown = true", but leave "abortEarly = false"
        const pipe = new JoiPipe(metatypeSchema, {
          defaultValidationOptions: {
            allowUnknown: false,
          },
        });

        try {
          // Should produce one error for the incorrect type of "prop", but non for the unknown property, because
          // the schema itself specifies allowUnknown: true, which takes precedence
          pipe.transform({ prop: 'a', unknownProp: 1 }, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toBe(
            'Request validation of query failed, because: "prop" must be a number',
          );
        }
      });
    });
  });

  describe('constructed with type', () => {
    describe('transform()', () => {
      it('should run validation on a passed payload', async () => {
        const pipe = new JoiPipe(metatype);

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "value" must be of type object',
          );
        }
      });

      it('should throw a BadRequestException on fail', async () => {
        const pipe = new JoiPipe(metatype);

        try {
          pipe.transform({}, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBe(true);
        }
      });

      it('should throw an error with a message containing all the details from Joi', async () => {
        const pipe = new JoiPipe(metatype);

        try {
          pipe.transform({}, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "prop" is required',
          );
        }
      });

      it('should use the "data" field from metadata in error message, if passed', async () => {
        const pipe = new JoiPipe(metatype);

        try {
          pipe.transform(1, { type: 'query', data: 'foo' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(`Request validation of query item 'foo' failed`);
        }
      });

      it('should transform transformable payloads', async () => {
        const pipe = new JoiPipe(metatype);

        const returnVal = pipe.transform({ prop: '1' }, { type: 'query' });

        expect(returnVal).toEqual({ prop: 1 });
      });

      it('should not throw an error for transformable payloads', async () => {
        const pipe = new JoiPipe(metatype);

        let error;
        try {
          pipe.transform({ prop: '1' }, { type: 'query' });
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      it('should throw a Nest BadRequestException if not configured otherwise', async () => {
        const pipe = new JoiPipe(metatype);

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBeTruthy();
        }
      });

      it('should throw a Nest BadRequestException when configured explicitely', async () => {
        const pipe = new JoiPipe(metatype, { usePipeValidationException: false });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof BadRequestException).toBeTruthy();
        }
      });

      it('should throw a JoiPipeValidationException when configured explicitely', async () => {
        const pipe = new JoiPipe(metatype, { usePipeValidationException: true });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error instanceof JoiPipeValidationException).toBeTruthy();
        }
      });

      it('should throw a custom error defined in the schema', async () => {
        const pipe = new JoiPipe(errorMetatype);

        try {
          pipe.transform({ prop: '-' }, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toBe('custom message');
          expect(error instanceof CustomError).toBeTruthy();
        }
      });

      it('should format error when configured explicitly', async () => {
        const pipe = new JoiPipe(metatype, { skipErrorFormatting: false });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('Request validation of');
        }
      });

      it('should not format error when configured explicitly', async () => {
        const pipe = new JoiPipe(metatype, { skipErrorFormatting: true });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).not.toContain('Request validation of');
        }
      });

      it('should format error when not configured explicitly', async () => {
        const pipe = new JoiPipe();

        try {
          pipe.transform(1, { type: 'query', metatype });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('Request validation of');
        }
      });

      it('should throw a JoiPipeValidationException but not format error when configured explicitly', async () => {
        const pipe = new JoiPipe(metatype, {
          skipErrorFormatting: true,
          usePipeValidationException: true,
        });

        try {
          pipe.transform(1, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).not.toContain('Request validation of');
        }
      });

      it('should use the default JoiValidationOptions if none have been specified in the pipe options', async () => {
        const pipe = new JoiPipe(metatype, {});

        // Unknown property to test the default setting of "allowUnknown: true"
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query' });
        expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
      });

      it('should use the default JoiValidationOptions if undefined was passed in the pipe options', async () => {
        const pipe = new JoiPipe(metatype, {
          defaultValidationOptions: undefined,
        });

        // Unknown property to test the default setting of "allowUnknown: true"
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query' });
        expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
      });

      it('should use the JoiValidationOptions passed in the pipe options', async () => {
        const pipe = new JoiPipe(metatype, {
          defaultValidationOptions: {
            stripUnknown: true,
          },
        });

        // unknownProp should be stripped
        const returnVal = pipe.transform({ prop: 1, unknownProp: 1 }, { type: 'query' });
        expect(returnVal).toEqual({ prop: 1 });
      });

      it('should partially override the default JoiValidationOptions', async () => {
        // Overrides the default value "allowUnknown = true", but leaves "abortEarly = false"
        const pipe = new JoiPipe(metatype, {
          defaultValidationOptions: {
            allowUnknown: false,
          },
        });

        try {
          // Should produce two errors, one for the incorrect type of "prop" and one for the unknown property
          pipe.transform({ prop: 'a', unknownProp: 1 }, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toBe(
            'Request validation of query failed, because: "prop" must be a number, "unknownProp" is not allowed',
          );
        }
      });

      it('should validate when given an explicit type with no decorated properties', async () => {
        const pipe = new JoiPipe(emptyType);

        try {
          pipe.transform({ prop: 'value' }, { type: 'query' });
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain(
            'Request validation of query failed, because: "prop" is not allowed',
          );
        }
      });

      for (const nativeType of NATIVE_TYPES) {
        it('should NOT validate when given an inbuilt type', async () => {
          const pipe = new JoiPipe(nativeType);

          let error;
          try {
            pipe.transform(undefined, { type: 'query' });
          } catch (error_) {
            error = error_;
          }

          expect(error).toBeUndefined();
        });
      }
    });
  });

  describe('constructed with HTTP Request (injection mode)', () => {
    class httpMetatype {
      @JoiSchema(Joi.string().valid('get').required())
      @JoiSchema([CREATE], Joi.string().valid('create').required())
      @JoiSchema([UPDATE], Joi.string().valid('update').required())
      prop!: string;

      @JoiSchema(Joi.number().required())
      @JoiSchema([CREATE], Joi.number().required())
      @JoiSchema([UPDATE], Joi.number().required())
      number!: number;
    }

    const cases = {
      GET: 'get',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
    };

    for (const [method, value] of Object.entries(cases)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const httpRequestObj: any = { method };

      describe(`${method} request`, () => {
        describe('transform()', () => {
          it('should run validation on a passed payload', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            try {
              pipe.transform({ prop: 'foo' }, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).not.toBe('should not be thrown');
            }
          });

          it('should throw a BadRequestException on fail', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            try {
              pipe.transform({ prop: 'foo' }, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error instanceof BadRequestException).toBe(true);
            }
          });

          it('should throw an error with a message containing all the details from Joi', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            try {
              pipe.transform({ prop: 'foo' }, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).toContain(
                `Request validation of query failed, because: "prop" must be [${value}]`,
              );
            }
          });

          it('should use the "data" field from metadata in error message, if passed', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            try {
              pipe.transform(1, { type: 'query', data: 'foo', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).toContain(`Request validation of query item 'foo' failed`);
            }
          });

          it('should transform transformable payloads', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            const returnVal = pipe.transform(
              { prop: value, number: '1' },
              { type: 'query', metatype: httpMetatype },
            );

            expect(returnVal).toEqual({ prop: value, number: 1 });
          });

          it('should not throw an error for transformable payloads', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            let error;
            try {
              pipe.transform(
                { prop: value, number: '1' },
                { type: 'query', metatype: httpMetatype },
              );
            } catch (error_) {
              error = error_;
            }

            expect(error).toBeUndefined();
          });

          it('should throw a Nest BadRequestException if not configured otherwise', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            try {
              pipe.transform(1, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error instanceof BadRequestException).toBeTruthy();
            }
          });

          it('should throw a Nest BadRequestException when configured explicitely', async () => {
            const pipe = new JoiPipe(httpRequestObj, { usePipeValidationException: false });

            try {
              pipe.transform(1, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error instanceof BadRequestException).toBeTruthy();
            }
          });

          it('should throw a JoiPipeValidationException when configured explicitely', async () => {
            const pipe = new JoiPipe(httpRequestObj, { usePipeValidationException: true });

            try {
              pipe.transform(1, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error instanceof JoiPipeValidationException).toBeTruthy();
            }
          });

          it('should throw a custom error defined in the schema', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            try {
              pipe.transform({ prop: '-' }, { type: 'query', metatype: errorMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).toBe('custom message');
              expect(error instanceof CustomError).toBeTruthy();
            }
          });

          it('should format error when configured explicitly', async () => {
            const pipe = new JoiPipe(httpRequestObj, { skipErrorFormatting: false });

            try {
              pipe.transform(1, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).toContain('Request validation of');
            }
          });

          it('should not format error when configured explicitly', async () => {
            const pipe = new JoiPipe(httpRequestObj, { skipErrorFormatting: true });

            try {
              pipe.transform(1, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).not.toContain('Request validation of');
            }
          });

          it('should format error when not configured explicitly', async () => {
            const pipe = new JoiPipe();

            try {
              pipe.transform(1, { type: 'query', metatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).toContain('Request validation of');
            }
          });

          it('should throw a JoiPipeValidationException but not format error when configured explicitly', async () => {
            const pipe = new JoiPipe(httpRequestObj, {
              skipErrorFormatting: true,
              usePipeValidationException: true,
            });

            try {
              pipe.transform(1, { type: 'query', metatype: httpMetatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).not.toContain('Request validation of');
            }
          });

          it('should use the default JoiValidationOptions if none have been specified in the pipe options', async () => {
            const pipe = new JoiPipe(httpRequestObj, {});

            // Unknown property to test the default setting of "allowUnknown: true"
            const returnVal = pipe.transform(
              { prop: 1, unknownProp: 1 },
              { type: 'query', metatype },
            );
            expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
          });

          it('should use the default JoiValidationOptions if undefined was passed in the pipe options', async () => {
            const pipe = new JoiPipe(httpRequestObj, {
              defaultValidationOptions: undefined,
            });

            // Unknown property to test the default setting of "allowUnknown: true"
            const returnVal = pipe.transform(
              { prop: 1, unknownProp: 1 },
              { type: 'query', metatype },
            );
            expect(returnVal).toEqual({ prop: 1, unknownProp: 1 });
          });

          it('should use the JoiValidationOptions passed in the pipe options', async () => {
            const pipe = new JoiPipe(httpRequestObj, {
              defaultValidationOptions: {
                stripUnknown: true,
              },
            });

            // unknownProp should be stripped
            const returnVal = pipe.transform(
              { prop: 1, unknownProp: 1 },
              { type: 'query', metatype },
            );
            expect(returnVal).toEqual({ prop: 1 });
          });

          it('should partially override the default JoiValidationOptions', async () => {
            // Overrides the default value "allowUnknown = true", but leaves "abortEarly = false"
            const pipe = new JoiPipe(httpRequestObj, {
              defaultValidationOptions: {
                allowUnknown: false,
              },
            });

            try {
              // Should produce two errors, one for the incorrect type of "prop" and one for the unknown property
              pipe.transform({ prop: 'a', unknownProp: 1 }, { type: 'query', metatype });
              throw new Error('should not be thrown');
            } catch (error) {
              expect(error.message).toBe(
                'Request validation of query failed, because: "prop" must be a number, "unknownProp" is not allowed',
              );
            }
          });

          it('should NOT validate when given a type with no decorated properties', async () => {
            const pipe = new JoiPipe(httpRequestObj);

            let error;
            try {
              pipe.transform({ prop: 'value' }, { type: 'query', metatype: emptyType });
            } catch (error_) {
              error = error_;
            }

            expect(error).toBeUndefined();
          });

          for (const nativeType of NATIVE_TYPES) {
            it('should NOT validate when given an inbuilt type', async () => {
              const pipe = new JoiPipe(httpRequestObj);

              let error;
              try {
                pipe.transform(undefined, { type: 'query', metatype: nativeType });
              } catch (error_) {
                error = error_;
              }

              expect(error).toBeUndefined();
            });
          }
        });
      });
    }
  });
});
