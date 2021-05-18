// HELPERS
export function isFunction(f) {
  return f instanceof Function;
};

export function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
};

export function isString(s) {
  return typeof s === 'string';
};

export function isUrl(exp) {
  const re = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/);
  return re.exec(exp) !== null ? true : false;
};

export function isArray(arr) {
  if (Array.isArray) return Array.isArray(arr);
  return Object.prototype.toString.call(arr) === '[object Array]';
};

export function HOP(obj, ...args) {
  while (args.length) {
    const arg = args.pop();
    if (
      typeof arg !== 'string' ||
      !Object.prototype.hasOwnProperty.call(obj, arg)
    ) {
      return false;
    };
  };
  return true;
};

export function flatten(arr) {
  return arr.reduce((acc, val) => acc.concat(val), []);
};
