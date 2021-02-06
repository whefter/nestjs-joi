import { Constructor, EXTENDS_PROTO_KEY } from './defs';

export function JoiSchemaExtends(type: Constructor): ClassDecorator {
  if (typeof type !== 'function') {
    throw new Error('Invalid arguments.');
  }

  // It is possible to check if the target constructor already extends a class by
  // comparing the next item in its prototype chain to Object. However, throwing
  // an error would prevent use of the decorator in cases where the user has
  // no influence over extended class but wants to specify a different parent class
  // for exactly that reason.

  return function (target: Parameters<ClassDecorator>[0]): void {
    // Get potential existing meta, throw if already set
    const extendsMeta: Constructor | undefined = Reflect.getOwnMetadata(EXTENDS_PROTO_KEY, target);

    if (extendsMeta) {
      throw new Error(`Cannot redefine parent type on ${target.constructor.name}`);
    }

    Reflect.defineMetadata(EXTENDS_PROTO_KEY, type, target);
  };
}
