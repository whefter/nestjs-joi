/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import * as Joi from 'joi';

import { JoiSchema } from '../../../src';

describe('@JoiSchema()', () => {
  describe('arguments', () => {
    it('should accept (Joi.Schema)', () => {
      let error;
      try {
        class test {
          @JoiSchema(Joi.string())
          prop!: string;

          @JoiSchema(Joi.number())
          otherProp!: number;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (NestedTypeClass)', () => {
      class type {}

      let error;
      try {
        class test {
          @JoiSchema(type)
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (NestedTypeClass, SchemaCustomizerFn)', () => {
      class type {}

      let error;
      try {
        class test {
          @JoiSchema(type, (schema: Joi.Schema) => schema.required())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (NestedTypeClass[])', () => {
      class type {}

      let error;
      try {
        class test {
          @JoiSchema([type])
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (NestedTypeClass[], SchemaCustomizerFn)', () => {
      class type {}

      let error;
      try {
        class test {
          @JoiSchema([type], (schema: Joi.Schema) => schema.required())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupStrings[], Joi.Schema)', () => {
      let error;
      try {
        class test {
          @JoiSchema(['group1', 'group2'], Joi.string())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALIDgroups[], Joi.Schema)', () => {
      try {
        class test {
          // @ts-ignore
          @JoiSchema([['array']], Joi.string())
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should accept (groupSymbols[], Joi.Schema)', () => {
      let error;
      try {
        class test {
          @JoiSchema([Symbol('group1'), Symbol('group2')], Joi.string())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupStrings[], NestedTypeClass)', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema(['group1', 'group2'], type)
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALIDgroups[], NestedTypeClass)', () => {
      class type {}

      try {
        class test {
          // @ts-ignore
          @JoiSchema([['array']], type)
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should accept (groupStrings[], NestedTypeClass, SchemaCustomizerFn)', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema(['group1', 'group2'], type, (schema: Joi.Schema) => schema.required())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupSymbols[], NestedTypeClass)', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema([Symbol('group1'), Symbol('group2')], type)
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupSymbols[], NestedTypeClass, SchemaCustomizerFn)', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema([Symbol('group1'), Symbol('group2')], type, (schema: Joi.Schema) =>
            schema.required(),
          )
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALIDgroups[], NestedTypeClass, SchemaCustomizerFn)', () => {
      class type {}

      try {
        class test {
          // @ts-ignore
          @JoiSchema([['array']], type, (schema: Joi.Schema) => schema.required())
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should accept (groupStrings[], NestedTypeClass[])', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema(['group1', 'group2'], [type])
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALIDgroups[], NestedTypeClass[])', () => {
      class type {}

      try {
        class test {
          // @ts-ignore
          @JoiSchema([['array']], [type])
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should accept (groupStrings[], NestedTypeClass[], SchemaCustomizerFn)', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema(['group1', 'group2'], [type], (schema: Joi.Schema) => schema.required())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupSymbols[], NestedTypeClass[])', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema([Symbol('group1'), Symbol('group2')], [type])
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should accept (groupSymbols[], NestedTypeClass[], SchemaCustomizerFn)', () => {
      class type {}

      let error;
      try {
        class test {
          // @ts-ignore
          @JoiSchema([Symbol('group1'), Symbol('group2')], [type], (schema: Joi.Schema) =>
            schema.required(),
          )
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALIDgroups[], NestedTypeClass[], SchemaCustomizerFn)', () => {
      class type {}

      try {
        class test {
          // @ts-ignore
          @JoiSchema([['array']], [type], (schema: Joi.Schema) => schema.required())
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should reject (groupStrings[])', () => {
      try {
        class test {
          // @ts-ignore
          @JoiSchema(['group1', 'group2'])
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should reject (string)', () => {
      try {
        class test {
          // @ts-ignore
          @JoiSchema('foo')
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should reject (number)', () => {
      try {
        class test {
          // @ts-ignore
          @JoiSchema(3)
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should throw when called on a Symbol property', () => {
      const symb = Symbol('prop');
      try {
        class test {
          @JoiSchema(Joi.string())
          [symb]!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid target property (symbol)');
      }
    });

    it('should throw when redefining the default group schema for a property', () => {
      try {
        class test {
          @JoiSchema(Joi.string())
          @JoiSchema(Joi.number())
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Cannot redefine schema');
      }
    });

    it('should throw when redefining a custom group schema for a property', () => {
      try {
        class test {
          @JoiSchema(['group1'], Joi.string())
          @JoiSchema(['group1'], Joi.number())
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Cannot redefine schema');
      }
    });

    it('should be callable twice on the same property for different groups', () => {
      let error;
      try {
        class test {
          @JoiSchema(['group1'], Joi.string())
          @JoiSchema(['group2'], Joi.number())
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });
  });
});
