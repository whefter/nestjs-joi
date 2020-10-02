import { Global, Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { JoiPipe } from './joi.pipe';

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
export class JoiPipeModule {}
