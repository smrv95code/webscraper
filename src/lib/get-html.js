import { WS } from './Errors';
import { isUrl } from './utils';

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
};

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
      };
    })
      .on('error', err => reject(err));
  });
};

function getHtmlFromFile(file, options) {
  return new Promise((resolve, reject) => {
    options.log && console.log('Retrieving html from file:', file);

    fs.readFile(file, 'utf8', (err, content) => {
      if (err) {
        reject(err);
      } else {
        options.log && console.log('Html retrieved.');
        resolve(content);
      };
    });
  });
};

export function getHtml(source, options) {
  if (isUrl(source)) {
    const parsedUrl = new URL(source);
    const [module, agent] = getModules(parsedUrl.protocol, options.keepAlive);
    return getHtmlFromUrl(module, agent, source, options);
  } else {
    if (fs === undefined) fs = require('fs');
    return getHtmlFromFile(source, options);
  };
};
