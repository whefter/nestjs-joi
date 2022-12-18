/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import { Controller, INestMicroservice, Module, UseFilters, UsePipes } from '@nestjs/common';
import { ClientProxy, ClientsModule, MessagePattern, Transport } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import * as Joi from 'joi';
import { JoiSchema } from 'joi-class-decorators';
import { JoiPipe } from 'nestjs-joi';
import { JoiPipeValidationRpcExceptionFilter } from 'nestjs-joi/microservice';

describe('JoiPipeValidationRpcExceptionFilter functionality', () => {
  class metatype {
    @JoiSchema(Joi.string().valid('default').required())
    prop!: unknown;
  }

  @Controller()
  @UseFilters(new JoiPipeValidationRpcExceptionFilter())
  class AppController {
    @MessagePattern({ cmd: 'test' })
    @UsePipes(
      new JoiPipe({
        usePipeValidationException: true,
      }),
    )
    test(args: metatype) {
      return 'OK';
    }
  }
  @Module({
    controllers: [AppController],
  })
  class AppModule {}

  let module: TestingModule;
  let app: INestMicroservice;
  let client: ClientProxy;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AppModule,

        ClientsModule.register([
          {
            name: 'AppService',
            transport: Transport.TCP,
          },
        ]),
      ],
    }).compile();

    app = module.createNestMicroservice({});

    await app.listen();

    client = app.get<ClientProxy>('AppService');
    await client.connect();
  });

  afterEach(async () => {
    await app.close();
    client.close();
  });

  it('should return an error object wth the Joi error message', async () => {
    try {
      const result = await client.send({ cmd: 'test' }, { prop: 'duh' }).toPromise();
      throw new Error('should not be thrown');
    } catch (error) {
      expect(error).toEqual({
        error: `Request validation of body failed, because: "prop" must be [default]`,
        message: `Request validation of body failed, because: "prop" must be [default]`,
      });
    }
  });
});
