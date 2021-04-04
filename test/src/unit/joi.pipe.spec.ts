/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import { BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

import { JoiPipe, JoiPipeValidationException } from '../../../src';

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
    accept('Request', { method: 'get' });

    describe('(pipe options)', () => {
      accept('{ group: string }', { group: 'group' });
      accept('{ group: symbol }', { group: Symbol('group') });
      reject('{ group: boolean }', 'Invalid JoiPipeOptions', { group: true });
      accept('{ usePipeValidationException: boolean }', { usePipeValidationException: true });
      reject('{ usePipeValidationException: string }', 'Invalid JoiPipeOptions', {
        usePipeValidationException: '1',
      });
    });
  });

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

    it('should not touch a payload if given nothing to construct a schema', async () => {
      const pipe = new JoiPipe();

      const payload = { prop: 'value' };

      const returnVal = pipe.transform(payload, { type: 'query' });
      expect(returnVal).toBe(payload);
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

    it('should throw a Nest BadRequestException when configured explicitely', async () => {
      const pipe = new JoiPipe(Joi.string(), { usePipeValidationException: false });

      try {
        pipe.transform(1, { type: 'query' });
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error instanceof BadRequestException).toBeTruthy();
      }
    });

    it('should throw a JoiPipeValidationException when configured explicitely', async () => {
      const pipe = new JoiPipe(Joi.string(), { usePipeValidationException: true });

      try {
        pipe.transform(1, { type: 'query' });
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error instanceof JoiPipeValidationException).toBeTruthy();
      }
    });
  });
});
