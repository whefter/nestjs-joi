import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { JOIPIPE_OPTIONS } from './defs';
import { JoiPipe, JoiPipeOptions } from './joi.pipe';

export interface JoiPipeModuleOptions {
  pipeOpts?: JoiPipeOptions;
}

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: JoiPipe,
    },
  ],
  exports: [],
})
export class JoiPipeModule {
  static forRoot(options: JoiPipeModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: APP_PIPE,
        useClass: JoiPipe,
      },
    ];

    if (options.pipeOpts) {
      providers.push({
        provide: JOIPIPE_OPTIONS,
        useValue: options.pipeOpts,
      });
    }

    return {
      module: JoiPipeModule,
      global: true,
      providers,
    };
  }
}
