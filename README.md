# webscraper

This scraper proposes a lightweight approach to scraping static sites. It is built on **cheerio** and focuses on processing, testing, shaping the scraped data.

+ Detailed usage demo in file: **./demo/demo.js** [ npm run demo ].
+ Compact version in folder: **./dist**.

<br/>

## Overview

```js
const { webscraper } = require('./webscraper');

const myScraper = webscraper({ format: 'object' });   // see option list below

// describe task:
const htmlSource = 'https://www.targetwebsite.com';   // or path to a file

const targetSelectors = [{
    name: 'date',                                     // choose a name for the target field
    sel: '.sel1 .sel2',                               // any combination of valid css selectors
    converter: date => date.split(" ").splice(2),     // optional. process field content (example)
    tester: dateArray => dateArray.length === 4,      // optional. test content (example)
  }, {
    name: 'name2',
    sel: $ => $('span').filter('.some-class'),        // some "cheerio expression"
  }, // ...
];

const shaper = scraped => {                           // optional. post-process the scraped data
  const { date, ...props } = scraped;
  return { date, group: { ...props }, prop: 'anything' };
};

// scrap
myScraper(htmlSource, targetSelectors, shaper)
    .then(data => console.log(data))
    .catch(err => console.error(err));

// output as per option.format setting (in this particular case, object was requested):
{
  date: [processedTestedContent],
  group: {
    name2: [processedTestedContent],
    // ...
  },
  prop: 'anything'
}
```

<br/>

## webscraper(\<object\>:options)

>- **returns:** \<function\> **function(source, selectors, shaper)**. Returns \<promise>\.

<br>

**options:**

+ **format:** \<string\>. Select output data format = 'array', 'set', 'object', 'map'.
+ **log:** \<boolean\>. Allow | mute logging.
+ **allowPartial:** \<boolean\>. Returns even if not all target fields data exist, pass test. Otherwise throws.
+ **keepAlive:** \<boolean\>. Controls the http/https Agent behavior.

```js
// defaults:
{
    format: 'array',
    log: false,
    allowPartial: false,
    keepAlive: false,
};
```

<br>

### function(\<string\>:source, \<array\>:selectors, \<function\>:shaper)

>- **return:** \<promise\> resolves with scraped data as: \<array\> | \<set\> | \<object\> | \<map\>.


**parameters:**

- **source:** \<string\>. Required. An url, file path source for the target html.

- **selectors:** \<array\>. Required. A list of objects describing the html fields to target.

    + **\<object\>:target { \<string\>:name, \<string\>|\<function\>:sel, \<function\>:converter, \<function\>:tester }**.

    + **name:** Required. Identifies the field in the output data.

    + **sel:** Required. Target selectors. Match content made available for processing, testing as an array.

        * set a combination of valid css selectors as you would using cheerio.
        * use a function returning a valid "cheerio expressions". Ex: $ => $('span').filter('.some-class').

    + **converter:** Optional. Processes every member of the match array.

    + **tester:** Optional. Tests the match array as a whole. Iterate through it to test its members.

    + **note:** If a tester is declared on a field, it will silently be excluded from the result output in case the test fails.

- **shaper:** Optional. Post-processes the scraper output. Takes the scraped data as single argument.

<br/>

**output:**

The name properties set in the "selectors" parameter are used to name output fields.

```js
selectors = [{ name: 'name1', ... }, { name: 'name2', ... }];

// format: Array, Set
[
  { name: 'name1', content: [processedTestedFieldContent] },
  { name: 'name2', content: [processedTestedFieldContent] },
]

// format Object, Map:
{
  'name1': [processedTestedFieldContent],
  'name2': [processedTestedFieldContent],
}
```

<br/>

## Error codes

- **EMPTY_SELECTORS**: None of the provided selectors are valid.
- **REQ_FAILED**: Invalid server response. Property Error.statusCode holds the server response code.
- **HTML_ALERT**: The scraped content is empty / failed test for *ALL target fields*. A clear signal that the website html has changed.
- **MISSING_FIELD**: When { allowPartial: false } only. The scraped content is empty / failed test for *ONE target field*.
