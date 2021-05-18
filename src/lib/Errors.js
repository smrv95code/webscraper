// ERRORS
const ErrorMessages = {
  TypeError: (arg, expected) => `The "${arg}" argument must be of type: ${expected}.`,
  'REQ_FAILED': statusCode => `Failed request. Server responsed with code: ${statusCode}`,
  'EMPTY_SELECTORS': 'Empty "selectors" array, unable to proceed.',
  'MISSING_FIELD': selName => `Selector "${selName}" failed the test: html may have changed.`,
  'HTML_ALERT': 'Empty content: html has probably changed !',
};

const messages = new Map();

for (const [key, val] of Object.entries(ErrorMessages)) {
  messages.set(key, val instanceof Function ? val : function () { return String(val) });
};

function makeScraperErrors(Base) {
  return class ScraperError extends Base {
    constructor(code, ...args) {
      const key = Base === Error ? code : Base.prototype.name;
      Base.prototype.name !== 'Error' && args.unshift(code);

      super(messages.get(key)(...args));
      this.code = key;
      Error.captureStackTrace(this, this.constructor);
    };
    get name() {
      return `${this.constructor.name} [${this.code}]`;
    };
  };
};

export const WS = {
  TypeError: makeScraperErrors(TypeError),
  Error: makeScraperErrors(Error),
};
