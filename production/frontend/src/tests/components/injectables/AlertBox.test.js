/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";

import { AlertBox, ERROR_LEVELS } from "../../../components/injectable/alert_box.js"


beforeEach(() => {});

afterEach(() => {
  cleanup()
});

describe("Injectable AlertBox", () => {
  it("Black Box test", () => {
    const TestMessage = "This is a message"

    render(
      <AlertBox
        level={ERROR_LEVELS.hint}
        message={TestMessage}
      />
    );

    expect(screen.getByText(TestMessage)).toBeVisible();
  });
});
