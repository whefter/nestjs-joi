/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';
import { required } from 'joi';

import { getTypeSchema, JoiPipe } from '../../../src';
import {
  AdvancedType,
  BasicType,
  BasicTypeWithNoDefaultOptions,
  BasicTypeWithOptions,
  EmptyType,
  ExtendedType,
  ExtendedTypeWithOptions,
  TypeWithNestedType,
  TypeWithNestedTypeAndCustomizer,
  TypeWithNestedTypeArray,
  TypeWithNestedTypeArrayAndArrayCustomizer,
  TypeWithNestedTypeArrayAndCustomizer,
} from '../fixtures';

describe('getTypeSchema with', () => {
  describe('EmptyType', () => {
    it('should return a schema for an empty object', async () => {
      const schema = getTypeSchema(EmptyType);

      expect(schema.describe()).toEqual({
        type: 'object',
        keys: {},
        preferences: {},
      });
    });
  });

  describe('BasicType', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicType);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop2'],
            },
          },
          preferences: {
            allowUnknown: false,
          },
        });
      });
    });

    describe('with group0', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicType, { group: 'group0' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop0: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop0_group0'],
            },
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop2'],
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicType, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop1_group1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop2_group1'],
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('ExtendedType', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(ExtendedType);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['extended_prop2'],
            },
            extendedProp: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['extended_extendedProp'],
            },
          },
          preferences: {
            allowUnknown: false,
          },
        });
      });
    });

    describe('with group0', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(ExtendedType, { group: 'group0' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop0: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop0_group0'],
            },
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['extended_prop2'],
            },
            extendedProp: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['extended_extendedProp'],
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(ExtendedType, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basic_prop1_group1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['extended_prop2_group1'],
            },
            extendedProp: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['extended_extendedProp_group1'],
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('AdvancedType', () => {
    it('should return the matching schema', async () => {
      const schema = getTypeSchema(AdvancedType);

      expect(schema.describe()).toEqual({
        type: 'object',
        keys: {
          prop: {
            type: 'alternatives',
            matches: [
              {
                schema: {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop2'],
                    },
                  },
                  preferences: {
                    allowUnknown: false,
                  },
                },
              },
              {
                schema: {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['extended_prop2'],
                    },
                    extendedProp: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['extended_extendedProp'],
                    },
                  },
                  preferences: {
                    allowUnknown: false,
                  },
                },
              },
            ],
          },
        },
        preferences: {},
      });
    });
  });

  describe('TypeWithNestedType', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedType);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['nested_prop1'],
            },
            nestedProp: {
              type: 'object',
              keys: {
                prop1: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop1'],
                },
                prop2: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop2'],
                },
              },
              preferences: {
                allowUnknown: false,
              },
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedType, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['nested_prop1_group1'],
            },
            nestedProp: {
              type: 'object',
              keys: {
                prop1: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop1_group1'],
                },
                prop2: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['extended_prop2_group1'],
                },
                extendedProp: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['extended_extendedProp_group1'],
                },
              },
              preferences: {},
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('TypeWithNestedTypeArray', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeArray);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['nested_array_prop1'],
            },
            nestedProp: {
              type: 'array',
              items: [
                {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop2'],
                    },
                  },
                  preferences: {
                    allowUnknown: false,
                  },
                },
              ],
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeArray, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['nested_array_prop1_group1'],
            },
            nestedProp: {
              type: 'array',
              items: [
                {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1_group1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['extended_prop2_group1'],
                    },
                    extendedProp: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['extended_extendedProp_group1'],
                    },
                  },
                  preferences: {},
                },
              ],
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('TypeWithNestedTypeAndCustomizer', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeAndCustomizer);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            nestedProp: {
              type: 'object',
              keys: {
                prop1: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop1'],
                },
                prop2: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop2'],
                },
              },
              preferences: {
                allowUnknown: false,
              },
              flags: {
                presence: 'optional',
              },
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeAndCustomizer, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            nestedProp: {
              type: 'object',
              keys: {
                prop1: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop1_group1'],
                },
                prop2: {
                  type: 'string',
                  flags: {
                    only: true,
                    presence: 'required',
                  },
                  allow: ['basic_prop2_group1'],
                },
              },
              preferences: {},
              flags: {
                presence: 'required',
              },
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('TypeWithNestedTypeArrayAndArrayCustomizer', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeArrayAndArrayCustomizer);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            nestedProp: {
              type: 'array',
              items: [
                {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop2'],
                    },
                  },
                  preferences: {
                    allowUnknown: false,
                  },
                },
              ],
              flags: {
                presence: 'optional',
              },
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeArrayAndArrayCustomizer, {
          group: 'group1',
        });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            nestedProp: {
              type: 'array',
              items: [
                {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1_group1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop2_group1'],
                    },
                  },
                  preferences: {},
                },
              ],
              flags: {
                presence: 'required',
              },
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('TypeWithNestedTypeArrayAndCustomizer', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeArrayAndCustomizer);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            nestedProp: {
              type: 'array',
              items: [
                {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop2'],
                    },
                  },
                  preferences: {
                    allowUnknown: false,
                  },
                  flags: {
                    presence: 'optional',
                  },
                },
              ],
              flags: {
                presence: 'required',
              },
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(TypeWithNestedTypeArrayAndCustomizer, {
          group: 'group1',
        });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            nestedProp: {
              type: 'array',
              items: [
                {
                  type: 'object',
                  keys: {
                    prop1: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop1_group1'],
                    },
                    prop2: {
                      type: 'string',
                      flags: {
                        only: true,
                        presence: 'required',
                      },
                      allow: ['basic_prop2_group1'],
                    },
                  },
                  preferences: {},
                  flags: {
                    presence: 'required',
                  },
                },
              ],
              flags: {
                presence: 'required',
              },
            },
          },
          preferences: {},
        });
      });
    });
  });

  describe('BasicTypeWithOptions', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicTypeWithOptions);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithoptions_prop'],
            },
          },
          preferences: {
            allowUnknown: false,
          },
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicTypeWithOptions, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithoptions_prop'],
            },
          },
          preferences: {
            allowUnknown: true,
          },
        });
      });
    });
  });

  describe('ExtendedTypeWithOptions', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(ExtendedTypeWithOptions);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithoptions_prop'],
            },
          },
          preferences: {
            allowUnknown: true,
          },
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(ExtendedTypeWithOptions, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithoptions_prop'],
            },
          },
          preferences: {
            allowUnknown: false,
          },
        });
      });
    });
  });

  describe('BasicTypeWithNoDefaultOptions', () => {
    describe('with no group', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicTypeWithNoDefaultOptions);

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithnodefaultoptions_prop1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithnodefaultoptions_prop2'],
            },
          },
          preferences: {},
        });
      });
    });

    describe('with group1', () => {
      it('should return the matching schema', async () => {
        const schema = getTypeSchema(BasicTypeWithNoDefaultOptions, { group: 'group1' });

        expect(schema.describe()).toEqual({
          type: 'object',
          keys: {
            prop1: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithnodefaultoptions_prop1_group1'],
            },
            prop2: {
              type: 'string',
              flags: {
                only: true,
                presence: 'required',
              },
              allow: ['basicwithnodefaultoptions_prop2_group1'],
            },
          },
          preferences: {
            abortEarly: true,
          },
        });
      });
    });
  });
});
