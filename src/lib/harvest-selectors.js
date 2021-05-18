import { WS } from './Errors';
import { isFunction, flatten } from './utils';

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
    };
    // accumulate fields that pass the test ONLY
    if (testPassed) {
      acc.push({ name: selector.name, content: content });
    } else {
      if (!options.allowPartial) throw new WS.Error('MISSING_FIELD', selector.name);
    };
    return acc;
  };
};

export function harvestSelectors(html, selectorArray, options) {
  if (cheerio === undefined) cheerio = require('cheerio');
  const $ = cheerio.load(html);
  const reducer = fieldReducer($, options);
  return selectorArray.reduce(reducer, []);
};
