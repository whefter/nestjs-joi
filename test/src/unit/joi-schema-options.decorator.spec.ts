/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as Joi from 'joi';

import { JoiSchemaOptions } from '../../../src';

describe('@JoiSchemaOptions()', () => {
  describe('arguments', () => {
    it('should accept (Joi.ValidationOptions)', () => {
      let error;
      try {
        @JoiSchemaOptions({
          abortEarly: true,
        })
        class test {
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALID Joi.ValidationOptions)', () => {
      try {
        @JoiSchemaOptions({
          // @ts-ignore
          invalid: 'false',
        })
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid Joi.ValidationOptions');
      }
    });

    it('should accept (groupStrings[], Joi.ValidationOptions)', () => {
      let error;
      try {
        @JoiSchemaOptions(['group1', 'group2'], {
          abortEarly: true,
        })
        class test {
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupSymbols[], Joi.ValidationOptions)', () => {
      let error;
      try {
        @JoiSchemaOptions([Symbol('group1'), Symbol('group2')], {
          abortEarly: true,
        })
        class test {
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALID groups[], Joi.ValidationOptions)', () => {
      try {
        // @ts-ignore
        @JoiSchemaOptions([['invalid']], {
          abortEarly: true,
        })
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should reject (INVALID groups[], INVALID Joi.ValidationOptions)', () => {
      try {
        // @ts-ignore
        @JoiSchemaOptions([['invalid']], {
          // @ts-ignore
          invalid: true,
        })
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should reject (groupStrings[], INVALID Joi.ValidationOptions)', () => {
      try {
        // @ts-ignore
        @JoiSchemaOptions(['group1', 'group2'], {
          // @ts-ignore
          invalid: true,
        })
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid Joi.ValidationOptions');
      }
    });

    it('should reject (groupSymbols[], INVALID Joi.ValidationOptions)', () => {
      try {
        // @ts-ignore
        @JoiSchemaOptions([Symbol('group1'), Symbol('group2')], {
          // @ts-ignore
          invalid: true,
        })
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid Joi.ValidationOptions');
      }
    });

    it('should throw when redefining default group options', () => {
      try {
        @JoiSchemaOptions({})
        @JoiSchemaOptions({})
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Cannot redefine schema options');
      }
    });

    it('should throw when redefining custom group options', () => {
      try {
        @JoiSchemaOptions(['group1'], {})
        @JoiSchemaOptions(['group1'], {})
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Cannot redefine schema options');
      }
    });

    it('should be callable twice on the same type for different groups', () => {
      let error;
      try {
        @JoiSchemaOptions(['group1'], {})
        @JoiSchemaOptions(['group2'], {})
        class test {
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });
  });
});
