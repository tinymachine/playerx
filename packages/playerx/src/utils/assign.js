/**
 * Complete assign is used to copy the values of all enumerable properties
 * from one or more source objects to a target object, including getters and setters.
 * It will return the target object.
 * Properties are still allowed to be overridden.
 *
 * @param  {Object} target
 * @param  {...Object} sources
 * @return {Object} The target with assigned properties
 */
export const completeAssign = createCompleteAssign({
  enumerable: true,
  configurable: true,
  writeable: false
});

/**
 * Create a complete assign function with custom descriptors.
 * @param  {Object} options - The custom descriptor options.
 * @return {Function}
 */
export function createCompleteAssign(options) {
  return (target, ...sources) => {
    sources.forEach(source => {
      Object.keys(source).forEach(prop => {
        const descriptor = Object.getOwnPropertyDescriptor(source, prop);
        Object.defineProperty(target, prop, assign(descriptor, options));
      });
    });
    return target;
  };
}

export const assign = Object.assign;
