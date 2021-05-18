'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// HELPERS
function isFunction(f) {
  return f instanceof Function;
}
function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}
function isString(s) {
  return typeof s === 'string';
}
function isUrl(exp) {
  const re = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/);
  return re.exec(exp) !== null ? true : false;
}
function isArray(arr) {
  if (Array.isArray) return Array.isArray(arr);
  return Object.prototype.toString.call(arr) === '[object Array]';
}
function HOP(obj, ...args) {
  while (args.length) {
    const arg = args.pop();
    if (
      typeof arg !== 'string' ||
      !Object.prototype.hasOwnProperty.call(obj, arg)
    ) {
      return false;
    }  }  return true;
}
function flatten(arr) {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

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
}
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
}
const WS = {
  TypeError: makeScraperErrors(TypeError),
  Error: makeScraperErrors(Error),
};

// TASK:  Get html
let
  httpModule,
  httpAgent,
  httpsModule,
  httpsAgent,
  fs;

function getModules(protocol, keepAlive) {
  if (protocol === 'http:') {
    if (httpModule === undefined) httpModule = require('http');
    if (httpAgent === undefined) httpAgent = new httpModule.Agent({ keepAlive: keepAlive });
    return [httpModule, httpAgent];
  } else {
    if (httpsModule === undefined) httpsModule = require('https');
    if (httpsAgent === undefined) httpsAgent = new httpsModule.Agent({ keepAlive: keepAlive });
    return [httpsModule, httpsAgent];
  }
}
function getHtmlFromUrl(module, agent, url, options) {
  return new Promise((resolve, reject) => {
    options.log && console.log('Retrieving html from url ...');

    module.get(url, { agent: agent }, res => {
      const { statusCode } = res;
      let content;

      if (statusCode >= 200 && statusCode < 300) {
        res.on('data', d => content += Buffer.from(d, 'uft8'));
        res.on('end', () => resolve(content));
      } else {
        const httpError = new WS.Error('REQ_FAILED', statusCode);
        httpError.statusCode = statusCode;
        reject(httpError);
      }    })
      .on('error', err => reject(err));
  });
}
function getHtmlFromFile(file, options) {
  return new Promise((resolve, reject) => {
    options.log && console.log('Retrieving html from file:', file);

    fs.readFile(file, 'utf8', (err, content) => {
      if (err) {
        reject(err);
      } else {
        options.log && console.log('Html retrieved.');
        resolve(content);
      }    });
  });
}
function getHtml(source, options) {
  if (isUrl(source)) {
    const parsedUrl = new URL(source);
    const [module, agent] = getModules(parsedUrl.protocol, options.keepAlive);
    return getHtmlFromUrl(module, agent, source, options);
  } else {
    if (fs === undefined) fs = require('fs');
    return getHtmlFromFile(source, options);
  }}

// TASK:  Extract content from target selectors
let cheerio;

function fieldReducer($, options) {
  return (acc, selector) => {
    let field = [];

    // harvest field content with cheerio
    const targetedSelectors = isFunction(selector.sel) ? selector.sel($) : $(selector.sel);
    targetedSelectors.each((i, digit) => field.push($(digit).text()));

    // process content throught converter fn
    const processedNested = isFunction(selector.converter) ? field.map(selector.converter) : field;
    const content = flatten(processedNested);

    // submit content to tester fn
    const tester = isFunction(selector.tester) ? selector.tester : () => { return true };
    const testPassed = tester(content);

    if (options.log) {
      console.log('\nSelector name: ', selector.name);
      console.log('Content raw:', field);
      console.log('Content processed:', content);
      console.log('Passed test:', testPassed);
    }    // accumulate fields that pass the test ONLY
    if (testPassed) {
      acc.push({ name: selector.name, content: content });
    } else {
      if (!options.allowPartial) throw new WS.Error('MISSING_FIELD', selector.name);
    }    return acc;
  };
}
function harvestSelectors(html, selectorArray, options) {
  if (cheerio === undefined) cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const reducer = fieldReducer($, options);
  return selectorArray.reduce(reducer, []);
}

// TASK:  model output data into shape
function toArr(data) {
  return data.map(el => { return { name: el.name, content: el.content } });
}
function toObj(data) {
  const reducer = (acc, el) => { acc[el.name] = el.content; return acc };
  return data.reduce(reducer, {});
}
function toMap(data) {
  const reducer = (acc, el) => { acc.set(el.name, el.content); return acc };
  return data.reduce(reducer, new Map());
}
function toSet(data) {
  const reducer = (acc, el) => { acc.add({ name: el.name, content: el.content }); return acc };
  return data.reduce(reducer, new Set());
}
function shapeData(data, options, shaper) {
  const emptyData = data.length === 0;

  if (emptyData) {
    throw new WS.Error('HTML_ALERT');
  } else {
    const output =  options.format === 'array' ? toArr(data) :
                    options.format === 'set' ? toSet(data) :
                    options.format === 'object' ? toObj(data) :
                    options.format === 'map' ? toMap(data) : undefined;
    return shaper(output);
  }}

// Validate inputs
function validateOptions(options, defaults) {
  const settings = Object.create(defaults);

  if (isObject(options)) {
    if (
      options.format === 'object' ||
      options.format === 'map' ||
      options.format === 'set'
    ) {
      settings.format = options.format;
    }    if (options.log === true) settings.log = true;
    if (options.allowPartial === true) settings.allowPartial = true;
    if (options.keepAlive === true) settings.keepAlive = true;
  }  return settings;
}
function validateSelectors(selectors, logFlag) {
  const screener = def => {
    if (HOP(def, 'name', 'sel')) return def;
    logFlag && console.warn('Invalid selector:', JSON.stringify(def), '\n');
  };
  return selectors.filter(screener);
}
/**
 * @exports webscraper
 * @param   {object}    options           see DEFAULT_OPTIONS for available options/defaults.
 * @returns {function}
 */

function webscraper(options) {
  const DEFAULT_OPTIONS = {
    format: 'array',        // {string}   select output data format: array|set|object|map.
    log: false,             // {boolean}  mute/allow logging.
    allowPartial: false,    // {boolean}  returns even if not all target fields exist, pass test.
    keepAlive: false,       // {boolean}  controls the http/https Agent behavior.
  };

  const Config = validateOptions(options, DEFAULT_OPTIONS);

  /**
   * @param {string}    source    required. Url, file path source for the target html.
   * @param {array}     selectors required. Describes target selectors, converters, testers.
   * @param {function}  shaper    optional. Scraped data post-processor function (arg: scrapedData).
   * @returns {Promise}           resolves with scraped data as per option.format setting.
   */

  return function (source, selectors, shaper) {
    if (!isString(source)) {
      throw new WS.TypeError('source', 'string');
    } else if (!isArray(selectors)) {
      throw new WS.TypeError('selectors', 'array');
    }
    const validSelectors = validateSelectors(selectors, Config.log);
    const postProcessor = isFunction(shaper) ? shaper : data => { return data };

    if (!validSelectors.length) throw new WS.Error('EMPTY_SELECTORS');

    return getHtml(source, Config)
      .then(html => harvestSelectors(html, validSelectors, Config))
      .then(scraped => shapeData(scraped, Config, postProcessor))
      .then(shaped => shaped)
      .catch(err => { throw (err) });
  };
}

exports.webscraper = webscraper;
