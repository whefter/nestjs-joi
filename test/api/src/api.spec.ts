/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import * as API from 'nestjs-joi';
import * as MicroserviceSubAPI from 'nestjs-joi/microservice';

describe('API', () => {
  it('should not have any unexpected exports', async () => {
    expect(Object.keys(API).sort()).toEqual(
      [
        'DEFAULT',
        'CREATE',
        'UPDATE',
        'JOIPIPE_OPTIONS',
        'JoiPipeValidationException',
        'JoiValidationGroups',
        'JoiPipe',
        'JoiPipeModule',

        // joi-class-decorators
        // This is a type
        // 'JoiValidationGroup',
        'getTypeSchema',
        'getClassSchema',
        'JoiSchema',
        'JoiSchemaCustomization',
        'JoiSchemaExtends',
        'JoiSchemaOptions',
      ].sort(),
    );
  });

  it('should export validation group symbols', async () => {
    expect(API.DEFAULT).toBeDefined();
    expect(typeof API.DEFAULT).toBe('symbol');
    expect(API.CREATE).toBeDefined();
    expect(typeof API.CREATE).toBe('symbol');
    expect(API.UPDATE).toBeDefined();
    expect(typeof API.UPDATE).toBe('symbol');

    expect(API.JoiValidationGroups).toBeDefined();
    expect(API.JoiValidationGroups).toEqual({
      DEFAULT: expect.any(Symbol),
      CREATE: expect.any(Symbol),
      UPDATE: expect.any(Symbol),
    });
  });

  it('should make the validation group aliases be direct references to the validation groups object', async () => {
    expect(API.DEFAULT).toBe(API.JoiValidationGroups.DEFAULT);
    expect(API.CREATE).toBe(API.JoiValidationGroups.CREATE);
    expect(API.UPDATE).toBe(API.JoiValidationGroups.UPDATE);
  });

  it('should export a JoiPipeValidationException', async () => {
    expect(API.JoiPipeValidationException).toBeDefined();
  });

  it('should export a JOIPIPE_OPTIONS symbol', async () => {
    expect(API.JOIPIPE_OPTIONS).toBeDefined();
    expect(typeof API.JOIPIPE_OPTIONS).toBe('symbol');
  });

  it('should export a JoiPipe constructor', async () => {
    expect(typeof API.JoiPipe).toBe('function');

    try {
      new API.JoiPipe();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API.JoiPipe is not constructible: ${error.message}`);
      } else {
        throw new Error('caught unexpected error type');
      }
    }
  });

  it('should export a JoiPipeModule constructor', async () => {
    expect(typeof API.JoiPipeModule).toBe('function');

    try {
      new API.JoiPipeModule();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API.JoiPipeModule is not constructible: ${error.message}`);
      } else {
        throw new Error('caught unexpected error type');
      }
    }
  });

  it('should export a getClassSchema function', async () => {
    expect(typeof API.getClassSchema).toBe('function');
  });

  it('should export a getTypeSchema function', async () => {
    expect(typeof API.getTypeSchema).toBe('function');
  });

  it('should export a JoiSchema decorator', async () => {
    expect(typeof API.JoiSchema).toBe('function');
  });

  it('should export a JoiSchemaExtends decorator', async () => {
    expect(typeof API.JoiSchemaExtends).toBe('function');
  });

  it('should export a JoiSchemaOptions decorator', async () => {
    expect(typeof API.JoiSchemaOptions).toBe('function');
  });
});

describe('Subfolder API: microservice/', () => {
  it('should not have any unexpected exports', async () => {
    expect(Object.keys(MicroserviceSubAPI).sort()).toEqual(
      ['JoiPipeValidationRpcExceptionFilter'].sort(),
    );
  });
  it('should export a JoiPipeValidationRpcExceptionFilter', async () => {
    expect(MicroserviceSubAPI.JoiPipeValidationRpcExceptionFilter).toBeDefined();
    expect(typeof MicroserviceSubAPI.JoiPipeValidationRpcExceptionFilter).toBe('function');
  });
});
