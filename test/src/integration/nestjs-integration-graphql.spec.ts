/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Body,
  Controller,
  Get,
  INestApplication,
  Module,
  Patch,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as Joi from 'joi';
import {
  Args,
  Field,
  GraphQLModule,
  ID,
  InputType,
  Mutation,
  ObjectType,
  OmitType,
  PickType,
  Query,
  Resolver,
} from '@nestjs/graphql';

import {
  CREATE,
  JoiPipe,
  JoiPipeModule,
  JoiSchema,
  JoiSchemaExtends,
  JoiValidationGroups,
} from '../../../src';

describe('NestJS GraphQL integration', () => {
  @ObjectType()
  class Entity {
    @Field(() => ID)
    id!: string;

    @Field({})
    @JoiSchema(Joi.string().valid('default').required())
    @JoiSchema([JoiValidationGroups.CREATE], Joi.string().valid('create').required())
    @JoiSchema([JoiValidationGroups.UPDATE], Joi.string().valid('update').required())
    prop!: string;
  }

  @InputType()
  @JoiSchemaExtends(Entity)
  class CreateEntityInput extends OmitType(Entity, ['id'], InputType) {}

  @Resolver()
  class EntityResolver {
    @Query(() => Entity)
    entity(): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    create_ConstructorInArgs(@Args('input', JoiPipe) input: CreateEntityInput): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    create_InstanceInArgs(@Args('input', new JoiPipe()) input: CreateEntityInput): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    create_InstanceInArgsWithGroup(
      @Args('input', new JoiPipe({ group: CREATE })) input: CreateEntityInput,
    ): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    @UsePipes(JoiPipe)
    create_ConstructorInUsePipes(@Args('input') input: CreateEntityInput): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    @UsePipes(new JoiPipe())
    create_InstanceInUsePipes(@Args('input') input: CreateEntityInput): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    @UsePipes(new JoiPipe({ group: CREATE }))
    create_InstanceInUsePipesWithGroup(@Args('input') input: CreateEntityInput): Entity {
      return this.getEntity();
    }

    @Mutation(() => Entity)
    create_NoPipe(@Args('input') input: CreateEntityInput): Entity {
      return this.getEntity();
    }

    private getEntity(): Entity {
      const entity = new Entity();
      entity.id = '1';
      entity.prop = 'newentity';

      return entity;
    }
  }

  let module: TestingModule;
  let app: INestApplication;

  describe('with pipes defined in resolver', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot({
            autoSchemaFile: true,
          }),
        ],
        providers: [EntityResolver],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    const CASES = [
      {
        title: '@Args(JoiPipe)',
        mutation: 'create_ConstructorInArgs',
        propValue: 'default',
      },
      {
        title: '@Args(new JoiPipe)',
        mutation: 'create_InstanceInArgs',
        propValue: 'default',
      },
      {
        title: '@Args(new JoiPipe(CREATE))',
        mutation: 'create_InstanceInArgsWithGroup',
        propValue: 'create',
      },
      {
        title: '@UsePipes(JoiPipe)',
        mutation: 'create_ConstructorInUsePipes',
        propValue: 'default',
      },
      {
        title: '@UsePipes(new JoiPipe)',
        mutation: 'create_InstanceInUsePipes',
        propValue: 'default',
      },
      {
        title: '@UsePipes(new JoiPipe(CREATE))',
        mutation: 'create_InstanceInUsePipesWithGroup',
        propValue: 'create',
      },
    ];
    for (const { title, mutation, propValue } of CASES) {
      describe(title, () => {
        it('should use the pipe correctly (positive test)', async () => {
          return request(app.getHttpServer())
            .post('/graphql')
            .send({
              operationName: mutation,
              variables: {
                CreateEntityInput: {
                  prop: propValue,
                },
              },
              query: `
                mutation ${mutation}($CreateEntityInput: CreateEntityInput!) {
                  ${mutation}(input: $CreateEntityInput) {
                    id
                    prop
                  }
                }
              `,
            })
            .expect(res =>
              expect(res.body).toEqual({
                data: {
                  [mutation]: {
                    id: '1',
                    prop: 'newentity',
                  },
                },
              }),
            );
        });

        it('should use the pipe correctly (negative test)', async () => {
          return request(app.getHttpServer())
            .post('/graphql')
            .send({
              operationName: mutation,
              variables: {
                CreateEntityInput: {
                  prop: 'NOT' + propValue,
                },
              },
              query: `
                mutation ${mutation}($CreateEntityInput: CreateEntityInput!) {
                  ${mutation}(input: $CreateEntityInput) {
                    id
                    prop
                  }
                }
              `,
            })
            .expect(res =>
              expect(res.body.errors[0].message).toContain(`"prop" must be [${propValue}]`),
            );
        });
      });
    }
  });

  describe('with app.useGlobalPipes(new JoiPipe)', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot({
            autoSchemaFile: true,
          }),
        ],
        providers: [EntityResolver],
      }).compile();

      app = module.createNestApplication();
      app.useGlobalPipes(new JoiPipe());
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should use the pipe correctly (positive test)', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: 'create_NoPipe',
          variables: {
            CreateEntityInput: {
              prop: 'default',
            },
          },
          query: `
                mutation create_NoPipe($CreateEntityInput: CreateEntityInput!) {
                  create_NoPipe(input: $CreateEntityInput) {
                    id
                    prop
                  }
                }
              `,
        })
        .expect(res =>
          expect(res.body).toEqual({
            data: {
              create_NoPipe: {
                id: '1',
                prop: 'newentity',
              },
            },
          }),
        );
    });

    it('should use the pipe correctly (negative test)', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: 'create_NoPipe',
          variables: {
            CreateEntityInput: {
              prop: 'NOT' + 'default',
            },
          },
          query: `
                mutation create_NoPipe($CreateEntityInput: CreateEntityInput!) {
                  create_NoPipe(input: $CreateEntityInput) {
                    id
                    prop
                  }
                }
              `,
        })
        .expect(res => expect(res.body.errors[0].message).toContain(`"prop" must be [default]`));
    });
  });

  describe('with app.useGlobalPipes(new JoiPipe(group))', () => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          GraphQLModule.forRoot({
            autoSchemaFile: true,
          }),
        ],
        providers: [EntityResolver],
      }).compile();

      app = module.createNestApplication();
      app.useGlobalPipes(new JoiPipe({ group: CREATE }));
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('should use the pipe correctly (positive test)', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: 'create_NoPipe',
          variables: {
            CreateEntityInput: {
              prop: 'create',
            },
          },
          query: `
                mutation create_NoPipe($CreateEntityInput: CreateEntityInput!) {
                  create_NoPipe(input: $CreateEntityInput) {
                    id
                    prop
                  }
                }
              `,
        })
        .expect(res =>
          expect(res.body).toEqual({
            data: {
              create_NoPipe: {
                id: '1',
                prop: 'newentity',
              },
            },
          }),
        );
    });

    it('should use the pipe correctly (negative test)', async () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          operationName: 'create_NoPipe',
          variables: {
            CreateEntityInput: {
              prop: 'NOT' + 'create',
            },
          },
          query: `
                mutation create_NoPipe($CreateEntityInput: CreateEntityInput!) {
                  create_NoPipe(input: $CreateEntityInput) {
                    id
                    prop
                  }
                }
              `,
        })
        .expect(res => expect(res.body.errors[0].message).toContain(`"prop" must be [create]`));
    });
  });
});
