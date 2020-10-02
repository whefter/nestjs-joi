/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Joi = require('joi');

import { JoiPipe, JoiSchema } from '../../src';

describe('JoiPipe: integration', () => {
  describe('standalone', () => {
    describe('with schema as argument', () => {
      it('should validate against the schema', async () => {
        const pipe = new JoiPipe(
          Joi.object().keys({
            prop: Joi.string(),
          }),
        );

        try {
          pipe.transform(
            {
              prop: 1,
            },
            { type: 'query' },
          );
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('"prop" must be a string');
        }
      });

      it('should validate against the schema, ignoring groups (positive test)', async () => {
        const pipe = new JoiPipe(
          Joi.object().keys({
            prop: Joi.string(),
          }),
          { group: 'group1' },
        );

        let error;
        try {
          pipe.transform(
            {
              prop: '1',
            },
            { type: 'query' },
          );
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });

      it('should validate against the schema, ignoring groups (negative test)', async () => {
        const pipe = new JoiPipe(
          Joi.object().keys({
            prop: Joi.string(),
          }),
          { group: 'group1' },
        );

        try {
          pipe.transform(
            {
              prop: 1,
            },
            { type: 'query' },
          );
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('"prop" must be a string');
        }
      });
    });

    describe('with type as argument', () => {
      it('should validate against a schema constructed from a passed type', async () => {
        class type {
          @JoiSchema(Joi.string())
          prop!: string;
        }

        const pipe = new JoiPipe(type);

        try {
          pipe.transform(
            {
              prop: 1,
            },
            { type: 'query' },
          );
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('"prop" must be a string');
        }
      });

      it('should validate against a schema constructed from a passed type, respecting passed group (positive test)', async () => {
        class type {
          @JoiSchema(['group1'], Joi.string())
          prop!: string;
        }

        const pipe = new JoiPipe(type, { group: 'group1' });

        try {
          pipe.transform(
            {
              prop: 1,
            },
            { type: 'query' },
          );
          throw new Error('should not be thrown');
        } catch (error) {
          expect(error.message).toContain('"prop" must be a string');
        }
      });

      it('should validate against a schema constructed from a passed type, respecting passed group (negative test)', async () => {
        class type {
          @JoiSchema(['group1'], Joi.string())
          prop!: string;
        }

        const pipe = new JoiPipe(type, { group: 'group2' });

        let error;
        try {
          pipe.transform(
            {
              prop: 1,
            },
            { type: 'query' },
          );
        } catch (error_) {
          error = error_;
        }

        expect(error).toBeUndefined();
      });
    });
  });
});
