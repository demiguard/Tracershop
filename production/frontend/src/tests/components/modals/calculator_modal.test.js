/**
 * @jest-environment jsdom
 */

import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { CalculatorModal } from '../../../components/modals/calculator_modal'

jest.mock('../../../components/injectable/calculator', () =>
  ({Calculator : () => <div>CalculatorMock</div>}))

let onClose = jest.fn()
let container = null

beforeEach(() => {
  delete window.location
  window.location = { href : "tracershop"}
  container = document.createElement("div");
})

afterEach(() => {
  cleanup();


  if(container != null) container.remove();
  container = null;
});

describe("Calculator Modal", () => {
  it("Standard Render Test", async () => {
    render(<CalculatorModal
      onClose={onClose}
    />)
  })
})
