/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import { JoiSchemaExtends } from '../../../src/';
import { EXTENDS_PROTO_KEY } from '../../../src/internal/defs';

describe('@JoiSchemaExtends()', () => {
  describe('arguments', () => {
    it('should accept (TypeClass)', () => {
      class type {}

      let error;
      try {
        @JoiSchemaExtends(type)
        class test {
          prop!: string;
        }
      } catch (error_) {
        error = error_;
      }

      expect(error).toBeUndefined();
    });

    it('should reject (INVALID TypeClass)', () => {
      try {
        // @ts-ignore
        @JoiSchemaExtends('invalid')
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid arguments');
      }
    });

    it('should throw when redefining the parent class', () => {
      class type {}

      try {
        @JoiSchemaExtends(type)
        @JoiSchemaExtends(type)
        class test {
          prop!: string;
        }
        throw new Error('should not be thrown');
      } catch (error) {
        expect(error.message).toContain('Cannot redefine parent type');
      }
    });
  });

  it('should the parent class as metadata on the target', () => {
    class type {}

    @JoiSchemaExtends(type)
    class test {
      prop!: string;
    }

    const meta = Reflect.getOwnMetadata(EXTENDS_PROTO_KEY, test);
    expect(meta).toBe(type);
  });
});
