# `nestjs-joi`

<a href="https://www.npmjs.com/package/nestjs-joi" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-joi.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/nestjs-joi" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-joi.svg" alt="Package License" /></a>
[![Coverage Status](https://coveralls.io/repos/github/whefter/nestjs-joi/badge.svg)](https://coveralls.io/github/whefter/nestjs-joi)
![CI](https://github.com/whefter/nestjs-joi/workflows/CI/badge.svg)

Easy to use `JoiPipe` as an interface between `joi` and NestJS with optional
decorator-based schema construction.

# Table of contents

- [`nestjs-joi`](#nestjs-joi)
- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Reference](#reference)
  - [`JoiPipe`](#joipipe)
    - [`new JoiPipe(pipeOpts?: { group })`](#new-joipipepipeopts--group-)
    - [`new JoiPipe(type, pipeOpts?: { group })`](#new-joipipetype-pipeopts--group-)
    - [`new JoiPipe(joiSchema, pipeOpts?: { group })`](#new-joipipejoischema-pipeopts--group-)
    - [Injection-enabled mode: `JoiPipe` (`@Query(JoiPipe)`, `@Param(JoiPipe)`, ...)](#injection-enabled-mode-joipipe-queryjoipipe-paramjoipipe-)
  - [`@JoiSchema()` property decorator](#joischema-property-decorator)
    - [`@JoiSchema(joiSchema)`](#joischemajoischema)
    - [`@JoiSchema(groups[], joiSchema)`](#joischemagroups-joischema)
    - [`@JoiSchema(nestedType, customizeSchemaCallback?)`](#joischemanestedtype-customizeschemacallback)
    - [`@JoiSchema(groups[], nestedType, customizeSchemaCallback?)`](#joischemagroups-nestedtype-customizeschemacallback)
    - [`@JoiSchema([nestedType], customizeArraySchemaCallback?, customizeSchemaCallback?)`](#joischemanestedtype-customizearrayschemacallback-customizeschemacallback)
    - [`@JoiSchema(groups[], [nestedType], customizeArraySchemaCallback?, customizeSchemaCallback?)`](#joischemagroups-nestedtype-customizearrayschemacallback-customizeschemacallback)
  - [`@JoiSchemaOptions()` class decorator](#joischemaoptions-class-decorator)
    - [`@JoiSchemaOptions(Joi.Options)`](#joischemaoptionsjoioptions)
    - [`@JoiSchemaOptions(groups[], Joi.options)`](#joischemaoptionsgroups-joioptions)
  - [Validation groups](#validation-groups)
    - [Built-in groups: `DEFAULT`, `CREATE`, `UPDATE`](#built-in-groups-default-create-update)
  - [`JoiPipeModule`](#joipipemodule)
  - [Class inheritance](#class-inheritance)
  - [`getTypeSchema(type, opts?: { group? })`](#gettypeschematype-opts--group-)

# Installation

```bash
npm install --save nestjs-joi
```

# Usage

Annotate your type/DTO classes with property schemas and options, then set up
your NestJS module to import `JoiPipeModule` to have your controller routes
auto-validated everywhere the type/DTO class is used:

The built-in groups `CREATE` and `UPDATE` are available for `POST/PUT`
and `PATCH`, respecitively.

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

It is possible to use `JoiPipe` on its own, without including it as a global
pipe. See below for a more complete documentation.

# Reference

## `JoiPipe`

`JoiPipe` can be used either as a global pipe (see below for `JoiPipeModule`) or
for specific requests inside the `@Param()`, `@Query` etc. Request decorators.

When used with the the Request decorators, there are two possibilities:

- pass a configured `JoiPipe` instance
- pass the `JoiPipe` constuctor itself to leverage the injection and built-in
  group capabilities

When handling a request, the `JoiPipe` instance will be provided by NestJS with
the payload and, if present, the `metatype` (`BookDto` in the example below).
The `metatype` is used to determine the schema that the payload is validated against,
unless `JoiPipe` is instanciated with an explicit type or schema. This is done by
evaluating metadata set on the `metatype`'s class properties, if present.

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

### `new JoiPipe(pipeOpts?: { group })`

A `JoiPipe` that will handle payloads based on a schema determined by the passed
`metatype`, if present.

If `group` is passed in the `pipeOpts`, only decorations specified for that group
will be used to construct the schema.

```typescript
  @Post('/')
  async createBook(@Body(new JoiPipe({ group: CREATE })) createData: BookDto) {
    // Validated creation data!
    return await this.bookService.createBook(createData);
  }
```

### `new JoiPipe(type, pipeOpts?: { group })`

A `JoiPipe` that will handle payloads based on the schema constructed from the passed
`type`. This pipe will ignore the request `metatype`.

If `group` is passed in the `pipeOpts`, only decorations specified for that group
will be used to construct the schema.

```typescript
  @Post('/')
  async createBook(@Body(new JoiPipe(BookDto, { group: CREATE })) createData: unknown) {
    // Validated creation data!
    return await this.bookService.createBook(createData);
  }
```

### `new JoiPipe(joiSchema, pipeOpts?: { group })`

A `JoiPipe` that will handle payloads based on the schema passed in the constructor
parameters. This pipe will ignore the request `metatype`.

If `group` is passed in the `pipeOpts`, only decorations specified for that group
will be used to construct the schema.

```typescript
  @Get('/:bookId')
  async getBook(@Param('bookId', new JoiPipe(Joi.string().required())) bookId: string) {
      // bookId guaranteed to be a string and defined and non-empty
      return this.bookService.getBookById(bookId);
  }
```

### Injection-enabled mode: `JoiPipe` (`@Query(JoiPipe)`, `@Param(JoiPipe)`, ...)

Uses an injection-enabled `JoiPipe` which can look at the request to determine
the HTTP method and, based on that, which in-built group (`CREATE`, `UPDATE`, `DEFAULT`)
to use.

Validates against the schema constructed from the `metatype`, if present, taking into
account the group determined as stated above.

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

## `@JoiSchema()` property decorator

Define a schema on a type (class) property. Properties with a schema annotation
are used to construct a full object schema.

**Example**

```typescript
class BookDto {
  @JoiSchema(Joi.string().required())
  name!: string;

  @JoiSchema(Joi.string().required())
  author!: string;

  @JoiSchema(Joi.number().optional())
  publicationYear?: number;
}
```

Will construct the following equivalent `Joi` schema:

```typescript
Joi.object().keys({
  name: Joi.string().required(),
  author: Joi.string().required(),
  publicationYear: Joi.number.optional(),
});
```

### `@JoiSchema(joiSchema)`

Assign the passed Joi schema to the decorated property for the `DEFAULT` group.

**Example**

```typescript
class BookDto {
  @JoiSchema(Joi.string().optional())
  name?: string;
}
```

### `@JoiSchema(groups[], joiSchema)`

Assign the passed Joi schema to the decorated property for the passed groups.

**Example**

```typescript
class BookDto {
  @JoiSchema([JoiValidationGroups.CREATE], Joi.string().required())
  name!: string;
}
```

### `@JoiSchema(nestedType, customizeSchemaCallback?)`

Assign the full schema constructed from the passed `nestedType` to the decorated property,
for the `DEFAULT` group.

The nested schema is constructed using the same method as other schemas, e.g.
non-decorated properties are not used in constructing the schema.

If the optional `customizeSchemaCallback` is provided, it will be called with the constructed
schema to allow customization, e.g. ´.options()´, `.required()` and so on.

**Example**

```typescript
class AuthorDto {
  @JoiSchema(BookDto, schema => schema.required())
  firstBook!: BookDto;
}
```

### `@JoiSchema(groups[], nestedType, customizeSchemaCallback?)`

Assign the full schema constructed from the passed `nestedType` to the decorated property,
for the passed groups.

**Example**

```typescript
class AuthorDto {
  @JoiSchema([JoiValidationGroups.UPDATE], BookDto, schema => schema.optional())
  firstBook?: BookDto;
}
```

### `@JoiSchema([nestedType], customizeArraySchemaCallback?, customizeSchemaCallback?)`

Assign a `Joi.array()`, with the full schema constructed from the passed `nestedType` as
`.item()`, to the decorated property, for the `DEFAULT` group.

The nested schema is constructed using the same method as other schemas, e.g.
non-decorated properties are not used in constructing the schema.

If `customizeArraySchemaCallback` is provided, it will be called with the constructed
_outer_ schema - the `.array()` schema - to allow customization, e.g.
´.options()´, `.required()` and so on.

If `customizeSchemaCallback` is provided, it will be called with the constructed
_inner_ schema - the one passed to `.item()` - to allow customization, e.g.
´.options()´, `.required()` and so on.

**Example**

```typescript
class AuthorDto {
  @JoiSchema([BookDto], arraySchema => arraySchema.required(), schema => schema.optional())
  books!: BookDto[];
}
```

**Note** that this is mainly a convenience type, as it is equivalent to:

```typescript
class AuthorDto {
  @JoiSchema(BookDto, schema => Joi.array().items(schema.optional()).required())
  books!: BookDto[];
}
```

### `@JoiSchema(groups[], [nestedType], customizeArraySchemaCallback?, customizeSchemaCallback?)`

Assign a `Joi.array()`, with the full schema constructed from the passed `nestedType` as
`.item()`, to the decorated property, for the passed groups.

**Example**

```typescript
class AuthorDto {
  @JoiSchema(
    [JoiValidationGroups.UPDATE],
    [BookDto],
    arraySchema => arraySchema.optional().default([]),
    schema => schema.optional(),
  )
  books!: BookDto[];
}
```

## `@JoiSchemaOptions()` class decorator

Assign the passed Joi _options_ to be passed to `.options()` on the full constructed
schema.

**Example**

```typescript
@JoiSchemaOptions({
  allowUnknown: false,
})
class BookDto {
  @JoiSchema(Joi.string().optional())
  name?: string;
}
```

### `@JoiSchemaOptions(Joi.Options)`

Assign the passed Joi options to the decorated class for the `DEFAULT` group.

**Example**

```typescript
@JoiSchemaOptions({
  allowUnknown: false,
})
class BookDto {
  @JoiSchema(Joi.string().optional())
  name?: string;
}
```

### `@JoiSchemaOptions(groups[], Joi.options)`

Assign the passed Joi options to the decorated class for the passed groups.

**Example**

```typescript
@JoiSchemaOptions([JoiValidationGroups.CREATE], {
  allowUnknown: false,
})
class BookDto {
  @JoiSchema([JoiValidationGroups.CREATE], Joi.string().optional())
  name?: string;
}
```

## Validation groups

Groups can be used to annotate a property (`@JoiSchema`) or class
(`@JoiSchemaOptions`) with different schemas/options for different use cases
without having to define a new type.

A straightforward use case for this is a type/DTO that behaves slightly differently
in each of the CREATE and UPDATE scenarios. The built-in groups explained below
are meant to make interfacing with that use case easier.

### Built-in groups: `DEFAULT`, `CREATE`, `UPDATE`

Three built-in groups are defined:

- `DEFAULT` is the default group assigned under the hood
  to any schema defined on a property if a group is not explicitely specified.
- `CREATE` is used for validation if `JoiPipe` is used in
  injection-enabled mode (either through `JoiPipeModule` or `@Body(JoiPipe)` etc.)
  and the request method is either `POST` or `PUT`
  - `PUT` is defined as being capable of completely replacing a resource
    or creating a new one in case a unique key is not found, which means
    all properties must be present the same way as for `POST`.
- `UPDATE` works the same way as `CREATE`, but is used if the
  request method is `PATCH`.

They can be imported in one of two ways, depending on your preference:

```typescript
import { JoiValidationGroups } from 'nestjs-joi';
import { DEFAULT, CREATE, UPDATE } from 'nestjs-joi';

JoiValidationGroups.CREATE === CREATE; // true
```

## `JoiPipeModule`

Importing `JoiPipeModule` into a module will install `JoiPipe` as a global
injection-enabled pipe.

This is a prerequisite for `JoiPipe` to be able to
use the built-in groups `CREATE` and `UPDATE`, since the `JoiPipe` must be able to
have the `Request` injected to determine the HTTP method. Calling
`useGlobalPipe(new JoiPipe())` is not enough to achieve that.

**Example**

```typescript
import { JoiPipeModule } from 'nestjs-joi';

@Module({
  controllers: [BookController],
  imports: [JoiPipeModule],
})
export class AppModule {}
```

This is equivalent to:
**Example**

```typescript
import { JoiPipe } from 'nestjs-joi';

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

## Class inheritance

Both `@JoiSchema()` and `@JoiSchemaOptions()` work with class inheritance.

```typescript
@JoiSchemaOptions({
  allowUnknown: false,
})
class BookDto {
  @JoiSchema(Joi.string().required())
  name!: string;
}

@JoiSchemaOptions({
  allowUnknown: true,
})
class ExtendedBookDto extends BookDto {
  @JoiSchema(Joi.string().optional())
  author?: string;
}
```

Will construct the following equivalent `Joi` schema for `ExtendedBookDto`:

```typescript
Joi.object()
  .keys({
    name: Joi.string().required(),
    author: Joi.string().optional(),
  })
  .options({
    allowUnknown: true,
  });
```

## `getTypeSchema(type, opts?: { group? })`

This function can be called to obtain the `Joi` schema constructed from
`type`. This is the function used internally by `JoiPipe` when it is called
with an explicit/implicit type/metatype. Nothing is cached.

A group can be passed to construct the schema for a specific
group (together with the groups specified in `@JoiSchema()` etc.).

This function makes possible advanced uses such as the following:

```typescript
class ThrillerDto {
  @JoiSchema(Joi.number().required())
  thrill!: number;
}

class RomanceDto {
  @JoiSchema(Joi.number().optional())
  romance?: number;
}

class AuthorDto {
  @JoiSchema(Joi.alternatives(getTypeSchema(ThrillerDto), getTypeSchema(RomanceDto)))
  booksRatings: ThrillerDto | RomanceDto;
}
```
