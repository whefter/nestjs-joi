/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import Joi = require('joi');
import { fromPairs } from 'lodash';

import { JoiPipe, JoiSchema, JoiSchemaOptions, JoiValidationGroups } from '../../../src';
import { Constructor } from '../../../src/internal/defs';

describe('basic', () => {
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

  class EmptyType {}

  @JoiSchemaOptions({
    allowUnknown: false,
  })
  class BasicType {
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

  const CASES: {
    [name: string]: {
      type: Constructor;
      opts: { group?: string };
      payload: unknown;
      expectErrors: string[];
    };
  } = {
    'schema constructed from basic type': {
      type: BasicType,
      opts: {},
      payload: {
        prop1: 'foo',
      },
      expectErrors: ['"prop1" must be [basic_prop1]', '"prop2" is required'],
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
    },
    'schema constructed from basic type with options': {
      type: BasicTypeWithOptions,
      opts: {},
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: ['"unknownProp" is not allowed'],
    },
    'schema constructed from extended type with options': {
      type: ExtendedTypeWithOptions,
      opts: {},
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: [],
    },
    'schema constructed from basic type with options, respecting groups': {
      type: BasicTypeWithOptions,
      opts: { group: 'group1' },
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: [],
    },
    'schema constructed from extended type with options, respecting groups': {
      type: ExtendedTypeWithOptions,
      opts: { group: 'group1' },
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: ['"unknownProp" is not allowed'],
    },
    'nothing: empty schema without @JoiSchema': {
      type: EmptyType,
      opts: {},
      payload: {
        prop: 'basicwithoptions_prop',
        unknownProp: 'string',
      },
      expectErrors: [],
    },
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
    fdescribe('with ' + mode + ' as argument', () => {
      for (const [caseName, { type, opts, payload, expectErrors }] of Object.entries(CASES)) {
        it('should validate against ' + caseName, async () => {
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
          }

          if (!expectErrors || !expectErrors.length) {
            expect(error_).toBeUndefined();
          }
        });
      }
    });
  }
});
