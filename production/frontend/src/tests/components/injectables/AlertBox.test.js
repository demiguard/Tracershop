/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup } from "@testing-library/react";

import { AlertBox, ERROR_LEVELS } from "../../../components/injectable/alert_box.js/index.js.js.js"


let container = null;
let root = null
beforeEach(() => {
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    if(root != null) root.unmount()
  })

  cleanup()

  if(container != null) container.remove();

  container = null;
  root = null;
});

describe("Injectable AlertBox", () => {
  it("Black Box test", async () => {

    const TestMessage = "This is a message"

    const RenderErrorBox = render(<AlertBox
      level={ERROR_LEVELS.hint}
      message={TestMessage}
    />, {target : container});
    expect(await screen.findByText(TestMessage)).toBeVisible();
  });
});

