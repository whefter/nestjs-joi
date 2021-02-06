import * as Joi from 'joi';

import { getTypeSchema, JoiSchema, JoiSchemaOptions, JoiSchemaExtends } from '../../src';

export class EmptyType {}

@JoiSchemaOptions({
  allowUnknown: false,
})
export class BasicType {
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

export class ExtendedType extends BasicType {
  @JoiSchema(Joi.string().valid('extended_prop2').required())
  @JoiSchema(['group1'], Joi.string().valid('extended_prop2_group1').required())
  prop2!: unknown;

  @JoiSchema(Joi.string().valid('extended_extendedProp').required())
  @JoiSchema(['group1'], Joi.string().valid('extended_extendedProp_group1').required())
  extendedProp!: string;
}

@JoiSchemaExtends(BasicType)
export class DecoratorExtendedType {
  @JoiSchema(Joi.string().valid('decorator_extended_prop2').required())
  @JoiSchema(['group1'], Joi.string().valid('decorator_extended_prop2_group1').required())
  prop2!: unknown;

  @JoiSchema(Joi.string().valid('decorator_extended_extendedProp').required())
  @JoiSchema(['group1'], Joi.string().valid('decorator_extended_extendedProp_group1').required())
  extendedProp!: string;
}

export class AdvancedType {
  @JoiSchema(Joi.alternatives(getTypeSchema(BasicType), getTypeSchema(ExtendedType)))
  prop!: unknown;
}

export class TypeWithNestedType {
  prop0!: unknown;

  @JoiSchema(Joi.string().valid('nested_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('nested_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema(BasicType)
  @JoiSchema(['group1'], ExtendedType)
  nestedProp!: unknown;
}

export class TypeWithNestedTypeArray {
  prop0!: unknown;

  @JoiSchema(Joi.string().valid('nested_array_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('nested_array_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema([BasicType])
  @JoiSchema(['group1'], [ExtendedType])
  nestedProp!: unknown;
}

export class TypeWithNestedTypeAndCustomizer {
  @JoiSchema(BasicType, schema => schema.optional())
  @JoiSchema(['group1'], BasicType, schema => schema.required())
  nestedProp!: unknown;
}

export class TypeWithNestedTypeArrayAndArrayCustomizer {
  @JoiSchema([BasicType], schema => schema.optional())
  @JoiSchema(['group1'], [BasicType], schema => schema.required())
  nestedProp!: unknown;
}

export class TypeWithNestedTypeArrayAndCustomizer {
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
export class BasicTypeWithOptions {
  @JoiSchema(Joi.string().valid('basicwithoptions_prop').required())
  prop!: unknown;
}

@JoiSchemaOptions({
  allowUnknown: true,
})
@JoiSchemaOptions(['group1'], {
  allowUnknown: false,
})
export class ExtendedTypeWithOptions extends BasicTypeWithOptions {}

@JoiSchemaOptions({
  allowUnknown: true,
})
@JoiSchemaOptions(['group1'], {
  allowUnknown: false,
})
@JoiSchemaExtends(BasicTypeWithOptions)
export class DecoratorExtendedTypeWithOptions {}

@JoiSchemaOptions(['group1'], {
  abortEarly: true,
})
export class BasicTypeWithNoDefaultOptions {
  @JoiSchema(Joi.string().valid('basicwithnodefaultoptions_prop1').required())
  @JoiSchema(['group1'], Joi.string().valid('basicwithnodefaultoptions_prop1_group1').required())
  prop1!: unknown;

  @JoiSchema(Joi.string().valid('basicwithnodefaultoptions_prop2').required())
  @JoiSchema(['group1'], Joi.string().valid('basicwithnodefaultoptions_prop2_group1').required())
  prop2!: unknown;
}
