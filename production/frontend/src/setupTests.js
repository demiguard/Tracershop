import { configure } from '@testing-library/dom';
configure({
  computedStyleSupportsPseudoElements: true
})
import "@testing-library/jest-dom"
import '@testing-library/jest-dom/extend-expect'
import 'jest-axe/extend-expect'

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
