/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup } from "@testing-library/react";

import { AlertBox, ERROR_LEVELS } from "../../../components/injectable/alert_box.js"
import { RecoverableError } from "~/lib/error_handling.js";


beforeEach(() => {});

afterEach(() => {
  cleanup()
});

describe("Injectable AlertBox", () => {
  it("Black Box test", () => {
    const TestMessage = "This is a message"

    render(
      <AlertBox
        error={new RecoverableError(
          TestMessage
        )}
      />
    );

    expect(screen.getByText(TestMessage)).toBeVisible();
  });

  it("Black Box test", () => {
    const TestMessage = "This is a message"

    render(
      <AlertBox
        error={new RecoverableError(
          TestMessage, ERROR_LEVELS.NO_ERROR
        )}
      />
    );

    expect(screen.queryByText(TestMessage)).toBeNull();
  });
});
