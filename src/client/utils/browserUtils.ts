// Browser-compatible utility functions
export const debuglog = (section: string) => {
  return (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${section}]`, ...args);
    }
  };
};

export const inspect = (obj: any, options?: any) => {
  try {
    return JSON.stringify(obj, null, options?.depth || 2);
  } catch (error) {
    return String(obj);
  }
};

export const inherits = (ctor: any, superCtor: any) => {
  if (!ctor || !superCtor) {
    throw new TypeError('Constructor and superConstructor must be valid');
  }

  if (typeof ctor !== 'function' || typeof superCtor !== 'function') {
    throw new TypeError('Constructor and superConstructor must be functions');
  }

  // Create a safe prototype chain using Object.create
  const proto = Object.create(superCtor.prototype || Object.prototype);
  
  // Set constructor property
  Object.defineProperty(proto, 'constructor', {
    value: ctor,
    writable: true,
    configurable: true
  });

  // Set up prototype chain
  ctor.prototype = proto;

  // Store super constructor reference
  Object.defineProperty(ctor, 'super_', {
    value: superCtor,
    writable: false,
    configurable: false
  });
};
