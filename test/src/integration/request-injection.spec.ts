/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Joi = require('joi');

import { JoiPipe, JoiSchema, JoiValidationGroups } from '../../../src';

describe('request injection', () => {
  class metatype {
    @JoiSchema(Joi.string())
    @JoiSchema([JoiValidationGroups.CREATE], Joi.number())
    @JoiSchema([JoiValidationGroups.UPDATE], Joi.symbol())
    prop!: unknown;
  }

  describe('POST', () => {
    it('should validate with the CREATE group (positive test)', async () => {
      const pipe = new JoiPipe({
        // @ts-ignore
        method: 'post',
      });

      let error;
      try {
        pipe.transform(
          {
            prop: 1,
          },
          { type: 'body', metatype },
        );
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should validate with the CREATE group (negative test)', async () => {
      const pipe = new JoiPipe({
        // @ts-ignore
        method: 'post',
      });

      try {
        pipe.transform(
          {
            prop: 'a',
          },
          { type: 'body', metatype },
        );
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('"prop" must be a number');
      }
    });
  });

  for (const method of ['PUT', 'PATCH']) {
    describe(method, () => {
      it('should validate with the UPDATE group (positive test)', async () => {
        const pipe = new JoiPipe({
          // @ts-ignore
          method,
        });

        let error;
        try {
          pipe.transform(
            {
              prop: Symbol('prop'),
            },
            { type: 'body', metatype },
          );
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      it('should validate with the CREATE group (negative test)', async () => {
        const pipe = new JoiPipe({
          // @ts-ignore
          method,
        });

        try {
          pipe.transform(
            {
              prop: 'a',
            },
            { type: 'body', metatype },
          );
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('"prop" must be a symbol');
        }
      });
    });
  }

  // Not all of them are realistic scenarios, but we want to make sure.
  for (const method of ['GET', 'DELETE', 'HEAD', 'OPTIONS']) {
    describe(method, () => {
      it('should validate with the default group (positive test)', async () => {
        const pipe = new JoiPipe({
          // @ts-ignore
          method,
        });

        let error;
        try {
          pipe.transform(
            {
              prop: 'a',
            },
            { type: 'query', metatype },
          );
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      it('should validate with the default group (negative test)', async () => {
        const pipe = new JoiPipe({
          // @ts-ignore
          method,
        });

        try {
          pipe.transform(
            {
              prop: 1,
            },
            { type: 'query', metatype },
          );
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('"prop" must be a string');
        }
      });
    });
  }
});
