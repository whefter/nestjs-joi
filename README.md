## `nestjs-joi`

<a href="https://www.npmjs.com/package/nestjs-joi" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-joi.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/nestjs-joi" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-joi.svg" alt="Package License" /></a>
[![Coverage Status](https://coveralls.io/repos/github/whefter/nestjs-joi/badge.svg)](https://coveralls.io/github/whefter/nestjs-joi)
![test](https://github.com/whefter/nestjs-joi/workflows/test/badge.svg)
![publish](https://github.com/whefter/nestjs-joi/workflows/publish/badge.svg)

Easy to use `JoiPipe` as an interface between `joi` and NestJS with optional decorator-based schema construction. Based on [`joi-class-decorators`](https://github.com/whefter/joi-class-decorators).

- [Installation](#installation)
  - [Peer dependencies](#peer-dependencies)
- [Usage](#usage)
  - [A note on `@nestjs/graphql`](#a-note-on-nestjsgraphql)
- [Reference](#reference)
  - [Validation groups](#validation-groups)
    - [Built-in groups: `DEFAULT`, `CREATE`, `UPDATE`](#built-in-groups-default-create-update)
  - [`JoiPipe`](#joipipe)
    - [`new JoiPipe(pipeOpts?)`](#new-joipipepipeopts)
    - [`new JoiPipe(type, pipeOpts?)`](#new-joipipetype-pipeopts)
    - [`new JoiPipe(joiSchema, pipeOpts?)`](#new-joipipejoischema-pipeopts)
    - [Pipe options (`pipeOpts`)](#pipe-options-pipeopts)
    - [Injection-enabled mode: `JoiPipe` (`@Query(JoiPipe)`, `@Param(JoiPipe)`, ...)](#injection-enabled-mode-joipipe-queryjoipipe-paramjoipipe-)
    - [Defining `pipeOpts` in injection-enabled mode](#defining-pipeopts-in-injection-enabled-mode)
    - [Error handling and custom schema errors](#error-handling-and-custom-schema-errors)
  - [`JoiPipeModule`](#joipipemodule)
  - [`JoiPipeValidationException`](#joipipevalidationexception)
  - [`@JoiSchema()` property decorator](#joischema-property-decorator)
  - [`@JoiSchemaOptions()` class decorator](#joischemaoptions-class-decorator)
  - [`@JoiSchemaExtends(type)` class decorator](#joischemaextendstype-class-decorator)
  - [`@JoiSchemaCustomization(callback)` class decorator](#joischemacustomizationcallback-class-decorator)
  - [`getClassSchema(typeClass, opts?: { group? })` (alias: `getTypeSchema()`)](#getclassschematypeclass-opts--group--alias-gettypeschema)

# Installation

```bash
npm install --save nestjs-joi
```

## Peer dependencies

```bash
npm install --save @nestjs/common@^7 @nestjs/core@^7 joi@^17 reflect-metadata@^0.1
```

# Usage

Annotate your type/DTO classes with property schemas and options, then set up your NestJS module to import `JoiPipeModule` to have your controller routes auto-validated everywhere the type/DTO class is used.

The built-in groups `CREATE` and `UPDATE` are available for `POST/PUT` and `PATCH`, respectively.

The `@JoiSchema()`, `@JoiSchemaOptions()`, `@JoiSchemaExtends()` decorators and the `getTypeSchema()` function are re-exported from the `joi-class-decorators` package.

```typescript
import { JoiPipeModule, JoiSchema, JoiSchemaOptions, CREATE, UPDATE } from 'nestjs-joi';
import * as Joi from 'joi';

@Module({
  controllers: [BookController],
  imports: [JoiPipeModule],
})
export class AppModule {}

@JoiSchemaOptions({
  allowUnknown: false,
})
export class BookDto {
  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  name!: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([CREATE], Joi.string().required())
  @JoiSchema([UPDATE], Joi.string().optional())
  author!: string;

  @JoiSchema(Joi.number().optional())
  publicationYear?: number;
}

@Controller('/books')
export class BookController {
  @Post('/')
  async createBook(@Body() createData: BookDto) {
    // Validated creation data!
    return await this.bookService.createBook(createData);
  }

  @Put('/')
  async createBook(@Body() createData: BookDto) {
    // Validated create data!
    return await this.bookService.createBook(createData);
  }

  @Patch('/')
  async createBook(@Body() updateData: BookDto) {
    // Validated update data!
    return await this.bookService.createBook(createData);
  }
}
```

It is possible to use `JoiPipe` on its own, without including it as a global pipe. See below for a more complete documentation.

## A note on `@nestjs/graphql`

This module can be used with `@nestjs/graphql`, but with some caveats:

1. passing `new JoiPipe()` to `useGlobalPipes()`, `@UsePipes()`, a pipe defined in `@Args()` etc. works as expected.
2. passing the `JoiPipe` constructor to `useGlobalPipes()`, `@UsePipes()`, `@Args()` etc. does **not** respect the passed HTTP method, meaning that the `CREATE`, `UPDATE` etc. groups will not be used automatically. This limitation is due, to the best of understanding, to Apollo, the GraphQL server used by `@nestjs/graphql`, which only processed GraphQL queries for if they are sent as `GET` and `POST`.
3. if `JoiPipe` is registered as a global pipe by defining an `APP_PIPE` provider, then **JoiPipe will not be called for GraphQL requests** (see https://github.com/nestjs/graphql/issues/325)

If you want to make sure a validation group is used for a specific resolver mutation, create a new pipe with `new JoiPipe({group: 'yourgroup'})` and pass it to `@UsePipes()` or `@Args()`.

To work around the issue of `OmitType()` etc. breaking the inheritance chain for schema building, see `@JoiSchemaExtends()` below.

## A note on `@nestjs/microservice`

This module can be used with `@nestjs/microservice`, but with some caveats:

1. `JoiPipe` will **not** throw an `RpcException`. It will either throw the usual `BadRequestException` (like for HTTP/GraphQL) or, if you set `usePipeValidationException` to `true`, a `JoiPipeValidationException` (detailed further below). As a result, when you use a `ClientProxy` to invoke a microservice method, NestJS will only return a generic `Internal server error` error object.
   - **Why?** There are some cases in which it is now possible to reliably determine if the current context is an RPC context (when the pipe instance is created with `new JoiPipe`). Handling the other cases, but not these, could potentially confuse users (why is this error generic here, but not there?). It is better to create a defined scenario (handle the error)
   - **How to handle it**: To obtain and handle the actual exception, you can create an ExceptionFilter for either to handle them (e.g. with `@Catch()`) and turn them into an `RpcException`. You can use the provided `JoiPipeValidationRpcExceptionFilter` class or use it as an example. Don't forget to set `usePipeValidationException` to `true`.

# Reference

## Validation groups

Groups can be used to annotate a property (`@JoiSchema`) or class (`@JoiSchemaOptions`) with different schemas/options for different use cases without having to define a new type.

A straightforward use case for this is a type/DTO that behaves slightly differently in each of the CREATE and UPDATE scenarios. The built-in groups explained below are meant to make interfacing with that use case easier. Have a look at the example in the [Usage](#usage) section.

**For more information, have a look at the** [**validation groups documentation from `joi-class-decorators`**](https://github.com/whefter/joi-class-decorators#validation-groups).

### Built-in groups: `DEFAULT`, `CREATE`, `UPDATE`

Three built-in groups are defined:

- `DEFAULT` is the default "group" assigned under the hood to any schema defined on a property, or any options defined on a class, if a group is not explicitely specified. **This is the same Symbol exported from the `joi-class-decorators` package.**
- `CREATE` is used for validation if `JoiPipe` is used in injection-enabled mode (either through `JoiPipeModule` or `@Body(JoiPipe)` etc.) and the request method is either `POST` or `PUT`
  - `PUT` is defined as being capable of completely replacing a resource or creating a new one in case a unique key is not found, which means all properties must be present the same way as for `POST`.
- `UPDATE` works the same way as `CREATE`, but is used if the request method is `PATCH`.

They can be imported in one of two ways, depending on your preference:

```typescript
import { value JoiValidationGroups } from 'nestjs-joi';
import { value DEFAULT, value CREATE, value UPDATE } from 'nestjs-joi';

JoiValidationGroups.CREATE === CREATE; // true
```

## `JoiPipe`

`JoiPipe` can be used either as a global pipe (see below for [`JoiPipeModule`](#joipipemodule)) or for specific requests inside the `@Param()`, `@Query` etc. Request decorators.

When used with the the Request decorators, there are two possibilities:

- pass a configured `JoiPipe` instance
- pass the `JoiPipe` constuctor itself to leverage the injection and built-in group capabilities

When handling a request, the `JoiPipe` instance will be provided by NestJS with the payload and, if present, the `metatype` (`BookDto` in the example below). The `metatype` is used to determine the schema that the payload is validated against, unless `JoiPipe` is instanciated with an explicit type or schema. This is done by evaluating metadata set on the `metatype`'s class properties, if present.

```typescript
@Controller('/books')
export class BookController {
  @Post('/')
  async createBook(@Body(JoiPipe) createData: BookDto) {
    // Validated creation data!
    return await this.bookService.createBook(createData);
  }
}
```

### `new JoiPipe(pipeOpts?)`

A `JoiPipe` that will handle payloads based on a schema determined by the passed `metatype`, if present.

If `group` is passed in the `pipeOpts`, only decorators specified for that group or the `DEFAULT` group will be used to construct the schema.

```typescript
  @Post('/')
  async createBook(@Body(new JoiPipe({ group: CREATE })) createData: BookDto) {
    // Validated creation data!
    return await this.bookService.createBook(createData);
  }
```

### `new JoiPipe(type, pipeOpts?)`

A `JoiPipe` that will handle payloads based on the schema constructed from the passed `type`. This pipe will ignore the request `metatype`.

If `group` is passed in the `pipeOpts`, only decorations specified for that group or the `DEFAULT` group will be used to construct the schema.

```typescript
  @Post('/')
  async createBook(@Body(new JoiPipe(BookDto, { group: CREATE })) createData: unknown) {
    // Validated creation data!
    return await this.bookService.createBook(createData);
  }
```

### `new JoiPipe(joiSchema, pipeOpts?)`

A `JoiPipe` that will handle payloads based on the schema passed in the constructor parameters. This pipe will ignore the request `metatype`.

If `group` is passed in the `pipeOpts`, only decorations specified for that group or the `DEFAULT` group will be used to construct the schema.

```typescript
  @Get('/:bookId')
  async getBook(@Param('bookId', new JoiPipe(Joi.string().required())) bookId: string) {
      // bookId guaranteed to be a string and defined and non-empty
      return this.bookService.getBookById(bookId);
  }
```

### Pipe options (`pipeOpts`)

Currently, the following options are available:

- `group` (`string | symbol`) When a `group` is defined, only decorators specified for that group or the `DEFAULT` group when declaring the schema will be used to construct the schema. **Default:** `undefined`
- `usePipeValidationException` (`boolean`) By default, `JoiPipe` throws a NestJS `BadRequestException` when a validation error occurs. This results in a `400 Bad Request` response, which should be suitable to most cases. If you need to have a reliable way to catch the thrown error, for example in an exception filter, set this to `true` to throw a `JoiPipeValidationException` instead. **Default:** `false`
- `defaultValidationOptions` (`Joi.ValidationOptions`) The default Joi validation options to pass to `.validate()`
  - **Default:** `{ abortEarly: false, allowUnknown: true }`
  - Note that validation options passed directly to a schema using `.prefs()` (or `.options()`) will **always** take precedence and can never be overridden with this option.
- `skipErrorFormatting` (`boolean`) By default, `JoiPipe` returns a formatted readable error message. If you need to handle error message formatting setting this to `true` will return the original error. **Default:** `false`

### Injection-enabled mode: `JoiPipe` (`@Query(JoiPipe)`, `@Param(JoiPipe)`, ...)

Uses an injection-enabled `JoiPipe` which can look at the request to determine the HTTP method and, based on that, which in-built group (`CREATE`, `UPDATE`, `DEFAULT`) to use.

Validates against the schema constructed from the `metatype`, if present, taking into account the group determined as stated above.

```typescript
export class BookDto {
  @JoiSchema(Joi.string().required())
  @JoiSchema([JoiValidationGroups.CREATE], Joi.string().required())
  @JoiSchema([JoiValidationGroups.UPDATE], Joi.string().optional())
  name!: string;

  @JoiSchema(Joi.string().required())
  @JoiSchema([JoiValidationGroups.CREATE], Joi.string().required())
  @JoiSchema([JoiValidationGroups.UPDATE], Joi.string().optional())
  author!: string;

  @JoiSchema(Joi.number().optional())
  publicationYear?: number;
}

@Controller()
class BookController {
  // POST: this will implicitely use the group "CREATE" to construct the schema
  @Post('/')
  async createBook(@Body(JoiPipe) createData: BookDto) {
    return await this.bookService.createBook(createData);
  }
}
```

### Defining `pipeOpts` in injection-enabled mode

In injection-enabled mode, options cannot be passed to `JoiPipe` directly since the constructor is passed as an argument instead of an instance, which would accept the `pipeOpts` argument.

Instead, the options can be defined by leveraging the DI mechanism itself to provide the options through a provider:

```typescript
@Module({
  ...
  controllers: [ControllerUsingJoiPipe],
  providers: [
    {
      provide: JOIPIPE_OPTIONS,
      useValue: {
        usePipeValidationException: true,
      },
    },
  ],
  ...
})
export class AppModule {}
```

**Note**: the provider must be defined on the correct module to be "visible" in the DI context in which the `JoiPipe` is being injected. Alternatively, it can be defined and exported in a global module. See [the NestJS documentation for this](https://docs.nestjs.com/modules).

For how to define options when using the `JoiPipeModule`, [refer to the section on `JoiPipeModule` below](#joipipemodule).

### Error handling and custom schema errors

As described in the [`pipeOpts`](#pipe-options-pipeopts), when a validation error occurs, `JoiPipe` throws a `BadRequestException` or a `JoiPipeValidationException` (if configured).

If your schema defines a custom error, that error will be thrown instead:

```typescript
@JoiSchema(
  Joi.string()
    .required()
    .alphanum()
    .error(
      new Error(
        `prop must contain only alphanumeric characters`,
      ),
    ),
)
prop: string;
```

## `JoiPipeModule`

Importing `JoiPipeModule` into a module will install `JoiPipe` as a global injection-enabled pipe.

This is a prerequisite for `JoiPipe` to be able to use the built-in groups `CREATE` and `UPDATE`, since the `JoiPipe` must be able to have the `Request` injected to determine the HTTP method. Calling `useGlobalPipe(new JoiPipe())` is not enough to achieve that.

**Example**

```typescript
import { value JoiPipeModule } from 'nestjs-joi';

@Module({
  controllers: [BookController],
  imports: [JoiPipeModule],
})
export class AppModule {}

//
// Equivalent to:
import { value JoiPipe } from 'nestjs-joi';

@Module({
  controllers: [BookController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: JoiPipe,
    },
  ],
})
export class AppModule {}
```

Pipe options (`pipeOpts`) can be passed by using `JoiPipeModule.forRoot()`:

```typescript
import { value JoiPipeModule } from 'nestjs-joi';

@Module({
  controllers: [BookController],
  imports: [
    JoiPipeModule.forRoot({
      pipeOpts: {
        usePipeValidationException: true,
      },
    }),
  ],
})
export class AppModule {}

//
// Equivalent to:
import { value JoiPipe } from 'nestjs-joi';

@Module({
  controllers: [BookController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: JoiPipe,
    },
    {
      provide: JOIPIPE_OPTIONS,
      useValue: {
        usePipeValidationException: true,
      },
    },
  ],
})
export class AppModule {}
```

## `JoiPipeValidationException`

Thrown instead of a `BadRequestException` if the `usePipeValidationException` option for `JoiPipe` is set to `true`.

**Properties**

- `message`: a formatted message, or the native `message` property value from the `Joi.ValidationError` if the `skipErrorFormatting` option for `JoiPipe` is set to `true`.
- `joiValidationError`: the native `Joi.ValidationError` thrown by Joi.

## `JoiPipeValidationRpcExceptionFilter`

**Not exported from `nestjs-joi` to prevent a dependency on `@nestjs/microservice`!**

```typescript
import { JoiPipeValidationRpcExceptionFilter } from 'nestjs-joi/microservice';
```

Exception filter that can be used in a microservice module to catch `JoiPipeValidationException` exceptions and re-throw them as `RpcException`, preventing NestJS from swallowing it quietly and turning it into a generic "Internal server error". **Note** that the RpcException does not save over the stack trace.

## `@JoiSchema()` property decorator

Define a schema on a type (class) property. Properties with a schema annotation are used to construct a full object schema.

[**API documentation in `joi-class-decorators` repository.**](https://github.com/whefter/joi-class-decorators#joischema-property-decorator)

## `@JoiSchemaOptions()` class decorator

Assign the passed Joi _options_ to be passed to `.options()` on the full constructed schema.

[**API documentation in `joi-class-decorators` repository.**](https://github.com/whefter/joi-class-decorators#joischemaoptions-class-decorator)

## `@JoiSchemaExtends(type)` class decorator

Specify an alternative extended class for schema construction. `type` must be a class constructor.

[**API documentation in `joi-class-decorators` repository.**](https://github.com/whefter/joi-class-decorators#joischemaextendstype-class-decorator)

## `@JoiSchemaCustomization(callback)` class decorator

Specify a customization function for the final constructed type schema. `callback` must be a function that takes a schema and returns a modified schema.

[**API documentation in `joi-class-decorators` repository.**](https://github.com/whefter/joi-class-decorators#joischemacustomization-class-decorator)

## `getClassSchema(typeClass, opts?: { group? })` (alias: `getTypeSchema()`)

This function can be called to obtain the `Joi` schema constructed from `type`. This is the function used internally by `JoiPipe` when it is called with an explicit/implicit type/metatype. Nothing is cached.

[**API documentation in `joi-class-decorators` repository.**](https://github.com/whefter/joi-class-decorators#getclassschematypeclass-opts--group--alias-gettypeschema)
