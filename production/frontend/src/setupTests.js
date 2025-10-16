import { configure } from '@testing-library/dom';
configure({
  computedStyleSupportsPseudoElements: true
})
import "@testing-library/jest-dom"
import { jest, expect } from "@jest/globals"

import { MATCH_EXTENSIONS } from '~/tests/jest_extension';

expect.extend(MATCH_EXTENSIONS);

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);
window.open = jest.fn()

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}
try {
  global.localStorage = new LocalStorageMock();
} catch {
  // I guess we are mocked anyways?
}

/* So In general, tracershop shouldn't send http requests back at the endpoint
   rather it should use the websocket to get data. That said: this is an
   alterative way of doing things, and therefore libraries might do things
   differently. These libraries should be mocked away. */

const originalXHR = global.XMLHttpRequest;

global.XMLHttpRequest = class extends originalXHR {
  open(method, url, ...args) {
    console.error(`  XMLHttpRequest detected: ${url}`);
    console.error('  Stack trace:', new Error().stack);

    return super.open(method, url, ...args);
  }
};

const originalFetch = global.fetch;

global.fetch = function(url, options) {
  console.error("  Fetch detected: ", url);
  console.error("  Stack trace:", new Error().stack);

  // Return a mock response to prevent actual network call
  return Promise.resolve({
    ok: true,
    json: async () => ({}),
    text: async () => '',
  });
};

/**
 * Note that this is first `sinner` react-svg tries to grab the svg from a
 * server, which is illegal! So we mocked that away.
 */

global.mockedSVGs = []

jest.mock('react-svg', () => ({
  ReactSVG: ({ src, beforeInjection, afterInjection, onClick, ...props }) => {
    const React = require('react');
    React.useEffect(() => {
      const mockedSVG = {
        setAttribute : jest.fn((attribute) => mockedSVG._attributes[attribute]),
        _attributes : {},
        _src : src,
      }

      if (beforeInjection) beforeInjection(mockedSVG);
      if (afterInjection) afterInjection(null, mockedSVG);

      global.mockedSVGs.push(mockedSVG);

      return () => {
        // Cleanup on unmount
        const index = global.mockedSVGs.indexOf(mockedSVG);
        if (index > -1) {
          global.mockedSVGs.splice(index, 1);
        }
      };

    }, [src, beforeInjection, afterInjection])

    return (
      <div
        data-testid="react-svg-mock"
        data-src={src}
        onClick={onClick}
        {...props}
      />
    );
  },
}));
