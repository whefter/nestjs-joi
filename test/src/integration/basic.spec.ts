/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Joi = require('joi');
import { fromPairs } from 'lodash';

import { JoiPipe, JoiSchema, JoiSchemaOptions, JoiValidationGroups } from '../../../src';
import { Constructor } from '../../../src/internal/defs';

class EmptyType {}

@JoiSchemaOptions({
  allowUnknown: false,
})
class BasicType {
  // No default group
  @JoiSchema(['group0'], Joi.string().valid('basic_prop0_group0').required())
  prop0!: unknown;

  @JoiSchema(Joi.string().valid('basic_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('basic_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema(Joi.string().valid('basic_prop2').required())
  @JoiSchema(['group1'], Joi.string().valid('basic_prop2_group1').required())
  prop2!: unknown;
}

class ExtendedType extends BasicType {
  @JoiSchema(Joi.string().valid('extended_prop2').required())
  @JoiSchema(['group1'], Joi.string().valid('extended_prop2_group1').required())
  prop2!: unknown;

  @JoiSchema(Joi.string().valid('extended_extendedProp').required())
  @JoiSchema(['group1'], Joi.string().valid('extended_extendedProp_group1').required())
  extendedProp!: string;
}

class TypeWithNestedType {
  prop0!: unknown;

  @JoiSchema(Joi.string().valid('nested_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('nested_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema(BasicType)
  @JoiSchema(['group1'], ExtendedType)
  nestedProp!: unknown;
}

class TypeWithNestedTypeArray {
  prop0!: unknown;

  @JoiSchema(Joi.string().valid('nested_array_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('nested_array_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema([BasicType])
  @JoiSchema(['group1'], [ExtendedType])
  nestedProp!: unknown;
}

class TypeWithNestedTypeAndCustomizer {
  @JoiSchema(BasicType, schema => schema.optional())
  @JoiSchema(['group1'], BasicType, schema => schema.required())
  nestedProp!: unknown;
}

class TypeWithNestedTypeArrayAndArrayCustomizer {
  @JoiSchema([BasicType], schema => schema.optional())
  @JoiSchema(['group1'], [BasicType], schema => schema.required())
  nestedProp!: unknown;
}

class TypeWithNestedTypeArrayAndCustomizer {
  @JoiSchema([BasicType], schema => schema.required(), schema => schema.optional())
  @JoiSchema(['group1'], [BasicType], schema => schema.required(), schema => schema.required())
  nestedProp!: unknown;
}

@JoiSchemaOptions({
  allowUnknown: false,
})
@JoiSchemaOptions(['group1'], {
  allowUnknown: true,
})
class BasicTypeWithOptions {
  @JoiSchema(Joi.string().valid('basicwithoptions_prop').required())
  prop!: unknown;
}

@JoiSchemaOptions({
  allowUnknown: true,
})
@JoiSchemaOptions(['group1'], {
  allowUnknown: false,
})
class ExtendedTypeWithOptions extends BasicTypeWithOptions {}

@JoiSchemaOptions(['group1'], {
  abortEarly: true,
})
class BasicTypeWithNoDefaultOptions {
  @JoiSchema(Joi.string().valid('basicwithnodefaultoptions_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('basicwithnodefaultoptions_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema(Joi.string().valid('basicwithnodefaultoptions_prop2').required())
  @JoiSchema(['group1'], Joi.string().valid('basicwithnodefaultoptions_prop2_group1').required())
  prop2!: unknown;
}

describe('basic integration', () => {
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

    it('should ignore a metatype passed in the metadata', async () => {
      const pipe = new JoiPipe(
        Joi.object().keys({
          prop: Joi.string(),
        }),
      );

      class metatype {
        @JoiSchema(Joi.number())
        prop!: number;
      }

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

  const CASES: {
    [name: string]: {
      fit?: boolean;
      type: Constructor;
      opts: { group?: string };
      payload: unknown;
      expectErrors: string[];
      notExpectErrors: string[];
    };
  } = {
    'schema constructed from basic type': {
      type: BasicType,
      opts: {},
      payload: {
        prop1: 'foo',
      },
      expectErrors: ['"prop1" must be [basic_prop1]', '"prop2" is required'],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from extended type': {
      type: ExtendedType,
      opts: {},
      payload: {
        prop1: 'foo',
        prop2: 'foo',
      },
      expectErrors: [
        '"prop1" must be [basic_prop1]',
        '"prop2" must be [extended_prop2]',
        '"extendedProp" is required',
      ],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from basic type, respecting groups': {
      type: BasicType,
      opts: { group: 'group1' },
      payload: {
        prop1: 'foo',
        prop2: 'foo',
      },
      expectErrors: [
        '"prop1" must be [basic_prop1_group1]',
        '"prop2" must be [basic_prop2_group1]',
      ],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from basic type, falling back to default group': {
      type: BasicType,
      opts: { group: 'groupX' },
      payload: {
        prop1: 'foo',
        prop2: 'foo',
      },
      expectErrors: ['"prop1" must be [basic_prop1]', '"prop2" must be [basic_prop2]'],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from extended type, respecting groups': {
      type: ExtendedType,
      opts: { group: 'group1' },
      payload: {
        prop1: 'foo',
        prop2: 'foo',
        extendedProp: 'foo',
      },
      expectErrors: [
        '"prop1" must be [basic_prop1_group1]',
        '"prop2" must be [extended_prop2_group1]',
        '"extendedProp" must be [extended_extendedProp_group1]',
      ],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from basic type with options': {
      type: BasicTypeWithOptions,
      opts: {},
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: ['"unknownProp" is not allowed'],
      notExpectErrors: [],
    },
    'schema constructed from extended type with options': {
      type: ExtendedTypeWithOptions,
      opts: {},
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: [],
      notExpectErrors: [],
    },
    'schema constructed from basic type with options, respecting groups': {
      type: BasicTypeWithOptions,
      opts: { group: 'group1' },
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: [],
      notExpectErrors: [],
    },
    'schema constructed from extended type with options, respecting groups': {
      type: ExtendedTypeWithOptions,
      opts: { group: 'group1' },
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: ['"unknownProp" is not allowed'],
      notExpectErrors: [],
    },
    'schema constructed from basic type with no default options': {
      type: BasicTypeWithNoDefaultOptions,
      opts: {},
      payload: {
        prop1: 'string',
        prop2: 'string',
      },
      expectErrors: [
        '"prop1" must be [basicwithnodefaultoptions_prop1]',
        '"prop2" must be [basicwithnodefaultoptions_prop2]',
      ],
      notExpectErrors: [],
    },
    'schema constructed from basic type with no default options, respecting groups': {
      type: BasicTypeWithNoDefaultOptions,
      opts: { group: 'group1' },
      payload: {
        prop1: 'string',
        prop2: 'string',
      },
      expectErrors: ['"prop1" must be [basicwithnodefaultoptions_prop1_group1]'],
      notExpectErrors: ['"prop2" must be [basicwithnodefaultoptions_prop2_group1]'],
    },
    'schema constructed from type with nested type (negative)': {
      type: TypeWithNestedType,
      opts: {},
      payload: {
        prop0: 'string',
        prop1: 'string',
        nestedProp: {
          prop1: 'string',
          prop2: 'string',
        },
      },
      expectErrors: [
        '"prop1" must be [nested_prop1]',
        '"nestedProp.prop1" must be [basic_prop1]',
        '"nestedProp.prop2" must be [basic_prop2]',
      ],
      notExpectErrors: ['"prop0"', 'nestedTypeWithFn'],
    },
    'schema constructed from type with nested type (positive)': {
      type: TypeWithNestedType,
      opts: {},
      payload: {
        prop0: 'string',
        prop1: 'nested_prop1',
        nestedProp: {
          prop1: 'basic_prop1',
          prop2: 'basic_prop2',
        },
      },
      expectErrors: [],
      notExpectErrors: ['"prop0"', '"prop1"', '"nestedProp.prop1"', '"nestedProp.prop2"'],
    },
    'schema constructed from type with nested type, respecting groups (negative)': {
      type: TypeWithNestedType,
      opts: { group: 'group1' },
      payload: {
        prop0: 'string',
        prop1: 'string',
        nestedProp: {
          prop1: 'string',
          prop2: 'string',
          extendedProp: 'string',
        },
      },
      expectErrors: [
        '"prop1" must be [nested_prop1_group1]',
        '"nestedProp.prop1" must be [basic_prop1_group1]',
        '"nestedProp.prop2" must be [extended_prop2_group1]',
        '"nestedProp.extendedProp" must be [extended_extendedProp_group1]',
      ],
      notExpectErrors: ['"prop0"', 'nestedTypeWithFn'],
    },
    'schema constructed from type with nested type, respecting groups (positive)': {
      type: TypeWithNestedType,
      opts: { group: 'group1' },
      payload: {
        prop0: 'string',
        prop1: 'nested_prop1_group1',
        nestedProp: {
          prop1: 'basic_prop1_group1',
          prop2: 'extended_prop2_group1',
          extendedProp: 'extended_extendedProp_group1',
        },
      },
      expectErrors: [],
      notExpectErrors: [
        '"prop0"',
        '"prop1"',
        '"nestedProp.prop1"',
        '"nestedProp.prop2"',
        '"nestedProp.extendedProp"',
      ],
    },

    'schema constructed from type with nested type array (negative)': {
      type: TypeWithNestedTypeArray,
      opts: {},
      payload: {
        prop0: 'string',
        prop1: 'string',
        nestedProp: [
          {
            prop1: 'string',
            prop2: 'string',
          },
        ],
      },
      expectErrors: [
        '"prop1" must be [nested_array_prop1]',
        '"nestedProp[0].prop1" must be [basic_prop1]',
        '"nestedProp[0].prop2" must be [basic_prop2]',
      ],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from type with nested type array (positive)': {
      type: TypeWithNestedTypeArray,
      opts: {},
      payload: {
        prop0: 'string',
        prop1: 'nested_array_prop1',
        nestedProp: [
          {
            prop1: 'basic_prop1',
            prop2: 'basic_prop2',
          },
        ],
      },
      expectErrors: [],
      notExpectErrors: [
        '"prop0"',
        '"prop1"',
        '"nestedProp[0].prop1"',
        '"nestedProp[0].prop2"',
        '"nestedProp[0].extendedProp"',
      ],
    },
    'schema constructed from type with nested type array, respecting groups (negative)': {
      type: TypeWithNestedTypeArray,
      opts: { group: 'group1' },
      payload: {
        prop0: 'string',
        prop1: 'string',
        nestedProp: [
          {
            prop1: 'string',
            prop2: 'string',
            extendedProp: 'string',
          },
        ],
      },
      expectErrors: [
        '"prop1" must be [nested_array_prop1_group1]',
        '"nestedProp[0].prop1" must be [basic_prop1_group1]',
        '"nestedProp[0].prop2" must be [extended_prop2_group1]',
        '"nestedProp[0].extendedProp" must be [extended_extendedProp_group1]',
      ],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from type with nested type array, respecting groups (positive)': {
      type: TypeWithNestedTypeArray,
      opts: { group: 'group1' },
      payload: {
        prop0: 'string',
        prop1: 'nested_array_prop1_group1',
        nestedProp: [
          {
            prop1: 'basic_prop1_group1',
            prop2: 'extended_prop2_group1',
            extendedProp: 'extended_extendedProp_group1',
          },
        ],
      },
      expectErrors: [],
      notExpectErrors: [
        '"prop0"',
        '"prop1"',
        '"nestedProp[0].prop1"',
        '"nestedProp[0].prop2"',
        '"nestedProp[0].extendedProp"',
      ],
    },
    'schema constructed from type with nested type and customizer (positive)': {
      type: TypeWithNestedTypeAndCustomizer,
      opts: {},
      payload: {
        nestedProp: undefined,
      },
      expectErrors: [],
      notExpectErrors: ['"nestedProp"'],
    },
    'schema constructed from type with nested type and customizer (negative)': {
      type: TypeWithNestedTypeAndCustomizer,
      opts: {},
      payload: {
        nestedProp: {
          prop1: 'string',
          prop2: 'string',
        },
      },
      expectErrors: [
        '"nestedProp.prop1" must be [basic_prop1]',
        '"nestedProp.prop2" must be [basic_prop2]',
      ],
      notExpectErrors: [],
    },
    'schema constructed from type with nested type and customizer, respecting groups (negative)': {
      type: TypeWithNestedTypeAndCustomizer,
      opts: { group: 'group1' },
      payload: {
        nestedProp: undefined,
      },
      expectErrors: ['"nestedProp" is required'],
      notExpectErrors: [],
    },
    'schema constructed from type with nested type and customizer, respecting groups (positive)': {
      type: TypeWithNestedTypeAndCustomizer,
      opts: { group: 'group1' },
      payload: {
        nestedProp: {
          prop1: 'basic_prop1_group1',
          prop2: 'basic_prop2_group1',
        },
      },
      expectErrors: [],
      notExpectErrors: ['"nestedProp"'],
    },
    'schema constructed from type with nested type array and array customizer (positive)': {
      type: TypeWithNestedTypeArrayAndArrayCustomizer,
      opts: {},
      payload: {
        nestedProp: undefined,
      },
      expectErrors: [],
      notExpectErrors: ['"nestedProp"'],
    },
    'schema constructed from type with nested type array and array customizer (negative)': {
      type: TypeWithNestedTypeArrayAndArrayCustomizer,
      opts: {},
      payload: {
        nestedProp: [
          {
            prop1: 'string',
            prop2: 'string',
          },
        ],
      },
      expectErrors: [
        '"nestedProp[0].prop1" must be [basic_prop1]',
        '"nestedProp[0].prop2" must be [basic_prop2]',
      ],
      notExpectErrors: [],
    },
    'schema constructed from type with nested type array and array customizer, respecting groups (negative)': {
      type: TypeWithNestedTypeArrayAndArrayCustomizer,
      opts: { group: 'group1' },
      payload: {
        nestedProp: undefined,
      },
      expectErrors: ['"nestedProp" is required'],
      notExpectErrors: [],
    },
    'schema constructed from type with nested type array and array customizer, respecting groups (positive)': {
      type: TypeWithNestedTypeArrayAndArrayCustomizer,
      opts: { group: 'group1' },
      payload: {
        nestedProp: [
          {
            prop1: 'basic_prop1_group1',
            prop2: 'basic_prop2_group1',
          },
        ],
      },
      expectErrors: [],
      notExpectErrors: ['"nestedProp"'],
    },
    'schema constructed from type with nested type array and customizer (positive)': {
      type: TypeWithNestedTypeArrayAndCustomizer,
      opts: {},
      payload: {
        nestedProp: [],
      },
      expectErrors: [],
      notExpectErrors: ['"nestedProp"'],
    },
    'schema constructed from type with nested type array and customizer (negative)': {
      type: TypeWithNestedTypeArrayAndCustomizer,
      opts: {},
      payload: {
        nestedProp: [
          {
            prop1: 'string',
            prop2: 'string',
          },
        ],
      },
      expectErrors: [
        '"nestedProp[0].prop1" must be [basic_prop1]',
        '"nestedProp[0].prop2" must be [basic_prop2]',
      ],
      notExpectErrors: [],
    },
    'schema constructed from type with nested type array and customizer, respecting groups (negative)': {
      type: TypeWithNestedTypeArrayAndCustomizer,
      opts: { group: 'group1' },
      payload: {
        nestedProp: [],
      },
      expectErrors: ['"nestedProp" does not contain 1 required value'],
      notExpectErrors: [],
    },
    'schema constructed from type with nested type array and customizer, respecting groups (positive)': {
      type: TypeWithNestedTypeArrayAndCustomizer,
      opts: { group: 'group1' },
      payload: {
        nestedProp: [
          {
            prop1: 'basic_prop1_group1',
            prop2: 'basic_prop2_group1',
          },
        ],
      },
      expectErrors: [],
      notExpectErrors: ['"nestedProp"'],
    },
    'nothing: empty schema without @JoiSchema': {
      type: EmptyType,
      opts: {},
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: [],
      notExpectErrors: [],
    },
    // Special inbuilt types: construct cases
    ...fromPairs(
      [String, Object, Number, Array].map(type => [
        'nothing: handle inbuilt type ' + type.name,
        {
          type,
          opts: {},
          payload: {
            prop: 'basicwithoptions_prop',
            unknownProp: 'string',
          },
          expectErrors: [],
        },
      ]),
    ),
  };

  for (const mode of ['type', 'metatype']) {
    describe('with ' + mode + ' as argument', () => {
      for (const [
        caseName,
        { fit: useFit, type, opts, payload, expectErrors, notExpectErrors },
      ] of Object.entries(CASES)) {
        (useFit ? fit : it)('should validate against ' + caseName, async () => {
          const pipe = mode === 'type' ? new JoiPipe(type, opts) : new JoiPipe(opts);

          let error_;
          try {
            pipe.transform(payload, {
              type: 'query',
              metatype: mode === 'metatype' ? type : undefined,
            });

            if (expectErrors && expectErrors.length) {
              throw new Error('should not be thrown');
            }
          } catch (error) {
            error_ = error;

            if (expectErrors && expectErrors.length) {
              expectErrors.map(x => expect(error.stack).toContain(x));
            }
            if (notExpectErrors && notExpectErrors.length) {
              notExpectErrors.map(x => expect(error.stack).not.toContain(x));
            }
          }

          if (!expectErrors || !expectErrors.length) {
            expect(error_).toBeUndefined();
          }
        });
      }
    });
  }
});
