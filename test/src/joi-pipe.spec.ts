/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Joi = require('joi');

import { JoiPipe, JoiSchema } from '../../src';

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
          headers: [],
        });
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });
  });

  describe('basic transform()', () => {
    it('should run validation on a passed payload', async () => {
      const pipe = new JoiPipe(Joi.string());

      try {
        pipe.transform(1, { type: 'query' });
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('"value" must be a string');
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
  });
});
