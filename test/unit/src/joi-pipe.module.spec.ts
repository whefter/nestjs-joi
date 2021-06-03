/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import { APP_PIPE } from '@nestjs/core';

import { JoiPipe, JOIPIPE_OPTIONS, JoiPipeModule } from '../../../src';

describe('JoiPipeModule', () => {
  describe('constructor', () => {
    it('should define the correct class metadata', async () => {
      const imports = Reflect.getMetadata('imports', JoiPipeModule);
      const providers = Reflect.getMetadata('providers', JoiPipeModule);
      const exports = Reflect.getMetadata('exports', JoiPipeModule);
      const controllers = Reflect.getMetadata('controllers', JoiPipeModule);
      const globalSetting = Reflect.getMetadata('__module:global__', JoiPipeModule);

      expect(imports).toEqual([]);
      expect(providers).toEqual([
        {
          provide: APP_PIPE,
          useClass: JoiPipe,
        },
      ]);
      expect(controllers).toEqual([]);
      expect(exports).toEqual([]);
      expect(globalSetting).toEqual(true);
    });
  });

  describe('forRoot()', () => {
    it('should return a correct DynamicModule definition without options', async () => {
      const dynamicModuleDef = JoiPipeModule.forRoot();

      expect(dynamicModuleDef).toEqual({
        module: JoiPipeModule,
        providers: [
          {
            provide: APP_PIPE,
            useClass: JoiPipe,
          },
        ],
        global: true,
      });
    });

    it('should create a provider definition for options when options are specified', async () => {
      const options = {
        pipeOpts: { usePipeValidationException: true },
      };
      const dynamicModuleDef = JoiPipeModule.forRoot(options);

      expect(dynamicModuleDef).toEqual({
        module: JoiPipeModule,
        providers: [
          {
            provide: APP_PIPE,
            useClass: JoiPipe,
          },
          {
            provide: JOIPIPE_OPTIONS,
            useValue: options.pipeOpts,
          },
        ],
        global: true,
      });
    });
  });
});
