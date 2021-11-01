/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable unused-imports/no-unused-vars-ts */

import {
  Body,
  Controller,
  Get,
  Global,
  INestApplication,
  Module,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as Joi from 'joi';
import { JoiSchema } from 'joi-class-decorators';
import { JoiPipe, JOIPIPE_OPTIONS, JoiPipeModule, JoiValidationGroups } from 'nestjs-joi';
import request from 'supertest';

describe('NestJS integration', () => {
  class metatype {
    @JoiSchema(Joi.string().required())
    @JoiSchema([JoiValidationGroups.CREATE], Joi.number().required())
    @JoiSchema([JoiValidationGroups.UPDATE], Joi.array().required())
    prop!: unknown;
  }

  let controller;
  let module: TestingModule;
  let app: INestApplication;
  let request_: request.Test;

  // Note: we will test one case (@Query or @Body) each, since the other cases
  // are considered to be equivalent

  describe('app module', () => {
    describe('without options', () => {
      const CASES = [JoiPipeModule, JoiPipeModule.forRoot()];

      for (const pipeModule of CASES) {
        beforeEach(async () => {
          @Controller()
          class ctrl {
            @Get('/')
            get(@Query() query: metatype): unknown {
              return { status: 'OK' };
            }

            @Post('/')
            post(@Body() body: metatype): unknown {
              return { status: 'OK' };
            }

            @Put('/')
            put(@Body() body: metatype): unknown {
              return { status: 'OK' };
            }

            @Patch('/')
            patch(@Body() body: metatype): unknown {
              return { status: 'OK' };
            }
          }
          controller = ctrl;

          module = await Test.createTestingModule({
            controllers: [controller],
            imports: [pipeModule],
          }).compile();

          app = module.createNestApplication();
          await app.init();
        });

        afterEach(async () => {
          await app.close();
        });

        describe('GET', () => {
          it('should use the pipe correctly (positive test)', async () => {
            return request(app.getHttpServer())
              .get('/?prop=foo')
              .expect(res =>
                expect(res.body).toEqual({
                  status: 'OK',
                }),
              );
          });

          it('should use the pipe correctly (negative test)', async () => {
            return request(app.getHttpServer())
              .get('/')
              .expect(res =>
                expect(res.body).toMatchObject({
                  statusCode: 400,
                  message: expect.stringContaining('"prop" is required'),
                }),
              );
          });
        });

        describe('POST', () => {
          it('should use the pipe correctly (positive test)', async () => {
            return request(app.getHttpServer())
              .post('/')
              .send({ prop: 1 })
              .expect(res =>
                expect(res.body).toEqual({
                  status: 'OK',
                }),
              );
          });

          it('should use the pipe correctly (negative test)', async () => {
            return request(app.getHttpServer())
              .post('/')
              .send({ prop: 'a' })
              .expect(res =>
                expect(res.body).toMatchObject({
                  statusCode: 400,
                  message: expect.stringContaining('"prop" must be a number'),
                }),
              );
          });
        });

        describe('PUT', () => {
          it('should use the pipe correctly (positive test)', async () => {
            return request(app.getHttpServer())
              .put('/')
              .send({ prop: [] })
              .expect(res =>
                expect(res.body).toEqual({
                  status: 'OK',
                }),
              );
          });

          it('should use the pipe correctly (negative test)', async () => {
            return request(app.getHttpServer())
              .put('/')
              .send({ prop: 'a' })
              .expect(res =>
                expect(res.body).toMatchObject({
                  statusCode: 400,
                  message: expect.stringContaining('"prop" must be an array'),
                }),
              );
          });
        });

        describe('PATCH', () => {
          it('should use the pipe correctly (positive test)', async () => {
            return request(app.getHttpServer())
              .patch('/')
              .send({ prop: [] })
              .expect(res =>
                expect(res.body).toEqual({
                  status: 'OK',
                }),
              );
          });

          it('should use the pipe correctly (negative test)', async () => {
            return request(app.getHttpServer())
              .patch('/')
              .send({ prop: 'a' })
              .expect(res =>
                expect(res.body).toMatchObject({
                  statusCode: 400,
                  message: expect.stringContaining('"prop" must be an array'),
                }),
              );
          });
        });
      }
    });

    describe('with options in .forRoot()', () => {
      beforeEach(async () => {
        @Controller()
        class ctrl {
          @Get('/')
          get(@Query() query: metatype): unknown {
            return { status: 'OK' };
          }
        }
        controller = ctrl;

        module = await Test.createTestingModule({
          controllers: [controller],
          imports: [
            JoiPipeModule.forRoot({
              pipeOpts: {
                usePipeValidationException: true,
              },
            }),
          ],
        }).compile();

        app = module.createNestApplication();
        // Silence the ExceptionHandler output on 500
        app.useLogger(false);
        await app.init();
      });

      afterEach(async () => {
        await app.close();
      });

      it('should use the pipe correctly (positive test)', async () => {
        return request(app.getHttpServer())
          .get('/?prop=foo')
          .expect(res =>
            expect(res.body).toEqual({
              status: 'OK',
            }),
          );
      });

      it('should use the pipe correctly (negative test)', async () => {
        return request(app.getHttpServer())
          .get('/')
          .expect(res =>
            expect(res.body).toMatchObject({
              statusCode: 500,
              message: expect.stringContaining('Internal server error'),
            }),
          );
      });
    });

    describe('options injection', () => {
      beforeEach(async () => {
        @Controller()
        class ctrl {
          @Get('/')
          get(@Query() query: metatype): unknown {
            return { status: 'OK' };
          }
        }
        controller = ctrl;

        @Global()
        @Module({
          providers: [
            {
              provide: JOIPIPE_OPTIONS,
              useValue: {
                usePipeValidationException: true,
              },
            },
          ],
          exports: [JOIPIPE_OPTIONS],
        })
        class OptionsModule {}

        module = await Test.createTestingModule({
          controllers: [controller],
          imports: [OptionsModule, JoiPipeModule],
        }).compile();

        app = module.createNestApplication();
        // Silence the ExceptionHandler output on 500
        app.useLogger(false);
        await app.init();
      });

      afterEach(async () => {
        await app.close();
      });

      it('should use the pipe correctly (positive test)', async () => {
        return request(app.getHttpServer())
          .get('/?prop=foo')
          .expect(res =>
            expect(res.body).toEqual({
              status: 'OK',
            }),
          );
      });

      it('should use the pipe correctly (negative test)', async () => {
        return request(app.getHttpServer())
          .get('/')
          .expect(res =>
            expect(res.body).toMatchObject({
              statusCode: 500,
              message: expect.stringContaining('Internal server error'),
            }),
          );
      });
    });
  });

  describe('method parameter pipe', () => {
    describe('without options', () => {
      beforeEach(async () => {
        @Controller()
        class ctrl {
          @Get('/')
          get(@Query(JoiPipe) query: metatype): unknown {
            return { status: 'OK' };
          }
        }
        controller = ctrl;

        module = await Test.createTestingModule({
          controllers: [controller],
        }).compile();

        app = module.createNestApplication();
        await app.init();
      });

      afterEach(async () => {
        await app.close();
      });

      it('should use the pipe correctly (positive test)', async () => {
        return request(app.getHttpServer())
          .get('/?prop=foo')
          .expect(res =>
            expect(res.body).toEqual({
              status: 'OK',
            }),
          );
      });

      it('should use the pipe correctly (negative test)', async () => {
        return request(app.getHttpServer())
          .get('/?prop=')
          .expect(res =>
            expect(res.body).toMatchObject({
              statusCode: 400,
              message: expect.stringContaining('"prop" is not allowed to be empty'),
            }),
          );
      });
    });
  });

  describe('options injection', () => {
    beforeEach(async () => {
      @Controller()
      class ctrl {
        @Get('/')
        get(@Query(JoiPipe) query: metatype): unknown {
          return { status: 'OK' };
        }
      }
      controller = ctrl;

      module = await Test.createTestingModule({
        controllers: [controller],
        providers: [
          {
            provide: JOIPIPE_OPTIONS,
            useValue: {
              usePipeValidationException: true,
            },
          },
        ],
      }).compile();

      app = module.createNestApplication();
      // Silence the ExceptionHandler output on 500
      app.useLogger(false);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should use the pipe correctly (positive test)', async () => {
      return request(app.getHttpServer())
        .get('/?prop=foo')
        .expect(res =>
          expect(res.body).toEqual({
            status: 'OK',
          }),
        );
    });

    it('should use the pipe correctly (negative test)', async () => {
      return request(app.getHttpServer())
        .get('/?prop=')
        .expect(res =>
          expect(res.body).toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('Internal server error'),
          }),
        );
    });
  });
});
