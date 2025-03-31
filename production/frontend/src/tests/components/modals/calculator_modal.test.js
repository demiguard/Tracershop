/**
 * @jest-environment jsdom
 */

import React from 'react'

import {jest} from '@jest/globals'

import { cleanup, render } from '@testing-library/react'
import { CalculatorModal } from '../../../components/modals/calculator_modal'

jest.mock('../../../components/injectable/calculator', () =>
  ({Calculator : () => <div>CalculatorMock</div>}))

let onClose = jest.fn()


beforeEach(() => {

})

afterEach(() => {
  cleanup();
});

describe("Calculator Modal", () => {
  it("Standard Render Test", async () => {
    render(<CalculatorModal
      onClose={onClose}
    />)
  })
})
