import { WS } from './Errors';

// TASK:  model output data into shape
function toArr(data) {
  return data.map(el => { return { name: el.name, content: el.content } });
};

function toObj(data) {
  const reducer = (acc, el) => { acc[el.name] = el.content; return acc };
  return data.reduce(reducer, {});
};

function toMap(data) {
  const reducer = (acc, el) => { acc.set(el.name, el.content); return acc };
  return data.reduce(reducer, new Map());
};

function toSet(data) {
  const reducer = (acc, el) => { acc.add({ name: el.name, content: el.content }); return acc };
  return data.reduce(reducer, new Set());
};

export function shapeData(data, options, shaper) {
  const emptyData = data.length === 0;

  if (emptyData) {
    throw new WS.Error('HTML_ALERT');
  } else {
    const output =  options.format === 'array' ? toArr(data) :
                    options.format === 'set' ? toSet(data) :
                    options.format === 'object' ? toObj(data) :
                    options.format === 'map' ? toMap(data) : undefined;
    return shaper(output);
  };
};
