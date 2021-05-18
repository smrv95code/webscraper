import { isObject, HOP, isString, isArray, isFunction } from './lib/utils';
import { WS } from './lib/Errors';
import { getHtml } from './lib/get-html';
import { harvestSelectors } from './lib/harvest-selectors';
import { shapeData } from './lib/shape-data';

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
    };
    if (options.log === true) settings.log = true;
    if (options.allowPartial === true) settings.allowPartial = true;
    if (options.keepAlive === true) settings.keepAlive = true
  };
  return settings;
};

function validateSelectors(selectors, logFlag) {
  const screener = def => {
    if (HOP(def, 'name', 'sel')) return def;
    logFlag && console.warn('Invalid selector:', JSON.stringify(def), '\n');
  };
  return selectors.filter(screener);
};

/**
 * @exports webscraper
 * @param   {object}    options           see DEFAULT_OPTIONS for available options/defaults.
 * @returns {function}
 */

export function webscraper(options) {
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
    };

    const validSelectors = validateSelectors(selectors, Config.log);
    const postProcessor = isFunction(shaper) ? shaper : data => { return data };

    if (!validSelectors.length) throw new WS.Error('EMPTY_SELECTORS');

    return getHtml(source, Config)
      .then(html => harvestSelectors(html, validSelectors, Config))
      .then(scraped => shapeData(scraped, Config, postProcessor))
      .then(shaped => shaped)
      .catch(err => { throw (err) });
  };
};
