/**
 * DEMO:      Scrap html to get the latest euromillions lottery draw
 * website:   www.fdj.fr
 * url:       https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats
 */

const { webscraper } = require('../index.js');

// 1. Create scraper with defaults(const scraper = webscraper()) or pick options
const fdjScraper = webscraper({
  format: 'object',                 // default: array
  log: true,                        // default: false
//  allowPartial: true,               // default: false
//  keepAlive: true,                  // default: false
});

// 2. Source{string}: file or url
const srcFile = __dirname + '/html.txt';

// 3. Selector{array}: describe each target field with name, css/cheerioFunction selector.
//    set field converter, tester functions (both optional)

// field converter examples
const extractDate = date => date.split(" ").splice(2);
const prefix0 = n => n.length === 1 ? `0${n}` : n;
const processMM = field => field.trim().split(' ').join('-');

// content (simplistic) tester examples
const checkLength = length => arr => arr.length === length;
const checkDate = checkLength(4);

const cheerioSt2 = $ => $('span').filter('.star-num');

const selectors = [
  { name: 'date', sel: '.drawing-infos_title', converter: extractDate, tester: checkDate },
  { name: 'num5', sel: '.numbers-item_num', converter: prefix0, tester: checkLength(5) },
  { name: 'st2', sel: cheerioSt2, converter: prefix0, tester: checkLength(2) },
  { name: 'mm', sel: '.numbers-bonus_num', converter: processMM, tester: checkLength(1) },
];

// 4. Add data post-processor function (optional)
const shaper = results => {
  const { date, ...draw } = results;
  return { game: 'euromillions', date, draw: { ...draw }, prizes: {} };
};

// SCRAP
const demo = async () => {
  try {
    const data = await fdjScraper(srcFile, selectors, shaper);
    // do something with the data
    console.log('\n========= scraped data ========\n');
    console.log(data);
    console.log('\n============================');
  } catch (e) {
    const { code, statusCode } = e;
    // decide what to do based on error type, server statusCode response
    console.error(e);
  };
};

demo();
