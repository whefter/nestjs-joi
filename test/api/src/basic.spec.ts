/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import assert from 'assert';
import * as Joi from 'joi';
import { JoiSchema } from 'joi-class-decorators';
import { fromPairs } from 'lodash';
import { JoiPipe } from 'nestjs-joi';
import { Class } from 'type-fest';

import {
  AdvancedType,
  BasicType,
  BasicTypeWithNoDefaultOptions,
  BasicTypeWithOptions,
  DecoratorExtendedType,
  DecoratorExtendedTypeWithOptions,
  EmptyType,
  ExtendedType,
  ExtendedTypeWithOptions,
  TypeWithNestedType,
  TypeWithNestedTypeAndCustomizer,
  TypeWithNestedTypeArray,
  TypeWithNestedTypeArrayAndArrayCustomizer,
  TypeWithNestedTypeArrayAndCustomizer,
} from '../../fixtures';

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
        assert(error instanceof Error);
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
        assert(error instanceof Error);
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
        assert(error instanceof Error);
        expect(error.message).toContain('"prop" must be a string');
      }
    });
  });

  const CASES: {
    [name: string]: {
      fit?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Class<any>;
      opts: { group?: string };
      payload: unknown;
      expectErrors: string[];
      notExpectErrors: string[];
    };
  } = {
    'schema constructed from empty type': {
      type: EmptyType,
      opts: {},
      payload: {},
      expectErrors: [],
      notExpectErrors: [],
    },
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
    'schema constructed from decorator-extended type': {
      type: DecoratorExtendedType,
      opts: {},
      payload: {
        prop1: 'foo',
        prop2: 'foo',
      },
      expectErrors: [
        '"prop1" must be [basic_prop1]',
        '"prop2" must be [decorator_extended_prop2]',
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
    'schema constructed from decorator-extended type, respecting groups': {
      type: DecoratorExtendedType,
      opts: { group: 'group1' },
      payload: {
        prop1: 'foo',
        prop2: 'foo',
        extendedProp: 'foo',
      },
      expectErrors: [
        '"prop1" must be [basic_prop1_group1]',
        '"prop2" must be [decorator_extended_prop2_group1]',
        '"extendedProp" must be [decorator_extended_extendedProp_group1]',
      ],
      notExpectErrors: ['"prop0"'],
    },
    'schema constructed from advanced type (positive, alternative 1)': {
      type: AdvancedType,
      opts: {},
      payload: {
        prop: {
          prop1: 'basic_prop1',
          prop2: 'basic_prop2',
        },
      },
      expectErrors: [],
      notExpectErrors: ['"prop"'],
    },
    'schema constructed from advanced type (positive, alternative 2)': {
      type: AdvancedType,
      opts: {},
      payload: {
        prop: {
          prop1: 'basic_prop1',
          prop2: 'extended_prop2',
          extendedProp: 'extended_extendedProp',
        },
      },
      expectErrors: [],
      notExpectErrors: ['"prop"'],
    },
    'schema constructed from advanced type (negative)': {
      type: AdvancedType,
      opts: {},
      payload: {
        prop: {
          prop1: 'basic_prop1',
        },
      },
      expectErrors: ['"prop" does not match any of the allowed types'],
      notExpectErrors: [],
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
    'schema constructed from decorator-extended type with options': {
      type: DecoratorExtendedTypeWithOptions,
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
    'schema constructed from decorator-extended type with options, respecting groups': {
      type: DecoratorExtendedTypeWithOptions,
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
    'schema constructed from type with nested type array and array customizer, respecting groups (negative)':
      {
        type: TypeWithNestedTypeArrayAndArrayCustomizer,
        opts: { group: 'group1' },
        payload: {
          nestedProp: undefined,
        },
        expectErrors: ['"nestedProp" is required'],
        notExpectErrors: [],
      },
    'schema constructed from type with nested type array and array customizer, respecting groups (positive)':
      {
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
    'schema constructed from type with nested type array and customizer, respecting groups (negative)':
      {
        type: TypeWithNestedTypeArrayAndCustomizer,
        opts: { group: 'group1' },
        payload: {
          nestedProp: [],
        },
        expectErrors: ['"nestedProp" does not contain 1 required value'],
        notExpectErrors: [],
      },
    'schema constructed from type with nested type array and customizer, respecting groups (positive)':
      {
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
            assert(error instanceof Error);

            error_ = error;

            if (expectErrors && expectErrors.length) {
              // @ts-ignore
              expectErrors.map(x => expect(error.stack).toContain(x));
            }
            if (notExpectErrors && notExpectErrors.length) {
              // @ts-ignore
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
