export function ReadToGenerate(opts: { dirty_key?: any } = {}) {
  const dirty_key = opts.dirty_key;
  return function (target: any, prop_name: string, descriptor: PropertyDescriptor) {
    const getter = descriptor.get;
    const setter = descriptor.set;
    if (!getter) {
      throw new TypeError(`@ReadToGenerate error: [${target.constructor}->${prop_name}] must be an getter prop.`);
    }
    if (setter) {
      throw new TypeError(`@ReadToGenerate error: [${target.constructor}->${prop_name}] could not has prop setter.`);
    }

    let cache_val: any;
    let generated = false;
    if (dirty_key !== undefined) {
      descriptor.get = () => {
        if (target[dirty_key]) {
          generated = false;
        }
        if (!generated) {
          generated = true;
          cache_val = getter.call(target);
        }
        return cache_val;
      }
    } else {
      descriptor.get = () => {
        if (!generated) {
          generated = true;
          cache_val = getter.call(target);
        }
        return cache_val;
      }
    }
    descriptor.get["source_fun"] = getter;
    return descriptor;
  }
}
