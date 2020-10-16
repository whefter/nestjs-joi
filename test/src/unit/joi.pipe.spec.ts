/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

import { JoiPipe } from '../../../src';

describe('JoiPipe', () => {
  describe('arguments', () => {
    it('should accept ()', () => {
      let error;
      try {
        new JoiPipe();
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (JoiPipeOptions)', () => {
      let error;
      try {
        new JoiPipe({ group: 'group' });
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALID JoiPipeOptions)', () => {
      try {
        // @ts-ignore
        new JoiPipe({ invalid: true });
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid JoiPipeOptions');
      }
    });

    it('should accept (ClassType)', () => {
      class type {}

      let error;
      try {
        new JoiPipe(type);
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (ClassType, JoiPipeOptions)', () => {
      class type {}

      let error;
      try {
        new JoiPipe(type, { group: 'group' });
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (ClassType, INVALID JoiPipeOptions)', () => {
      class type {}

      try {
        // @ts-ignore
        new JoiPipe(type, { invalid: true });
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid JoiPipeOptions');
      }
    });

    it('should accept (Joi.Schema)', () => {
      let error;
      try {
        new JoiPipe(Joi.string());
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (Joi.Schema, JoiPipeOptions)', () => {
      let error;
      try {
        new JoiPipe(Joi.string(), { group: 'group' });
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (Joi.Schema, INVALID JoiPipeOptions)', () => {
      try {
        // @ts-ignore
        new JoiPipe(Joi.string(), { invalid: true });
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid JoiPipeOptions');
      }
    });

    it('should accept (Request)', () => {
      let error;
      try {
        new JoiPipe({
          // @ts-ignore
          method: 'get',
        });
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
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
  });
});
