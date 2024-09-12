/**
 * @jest-environment jsdom
 */

import React from 'react'

import { jest } from '@jest/globals'
import { DeadlineDisplay } from '~/components/injectable/deadline_display'
import { render } from '@testing-library/react'
import { Deadline } from '~/dataclasses/dataclasses'
import { DEADLINE_TYPES } from '~/lib/constants'

const testLabelName = "test-label"

beforeEach(() => {
  jest.spyOn(global, "clearInterval");
  jest.spyOn(global, "setInterval");
})

describe("Deadline display test suite", () => {
  it("Render without a deadline", () => {
    const {container, unmount} = render(
      <DeadlineDisplay
        aria-label={testLabelName}
      />
    );
    expect(setInterval).not.toHaveBeenCalled();

    unmount();

    expect(clearInterval).not.toHaveBeenCalled();
  });

  it("Standard render test", () => {
    const deadline = new Deadline(
      1, DEADLINE_TYPES.DAILY, "11:30:00", null
    )

    const {container, unmount} = render(
      <DeadlineDisplay
        deadline={deadline}
        deadline_name="Blah"
        aria-label={testLabelName}
      />
    );
    expect(setInterval).toHaveBeenCalled();

    unmount();

    expect(clearInterval).toHaveBeenCalled();
  });
})