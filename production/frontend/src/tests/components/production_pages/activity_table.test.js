/**
 * @jest-environment jsdom
 */

import React from "react";
import { act, scryRenderedComponentsWithType } from "react-dom/test-utils";
import { fireEvent, getByRole, render, screen, cleanup } from "@testing-library/react"
import { createRoot } from "react-dom/client";

import { WS } from "jest-websocket-mock";
import { ActivityTable } from "../../../components/production_pages/activity_table.js"
import { TracerWebSocket} from "../../../lib/tracer_websocket.js"
import { TRACER_TYPE_ACTIVITY } from "../../../lib/constants.js";


  let container = null;
  let root = null
  beforeEach(() => {
    container = document.createElement("div");
    root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount()
  })

  cleanup()

  container.remove();
  container = null;
  root = null;
});

describe("Activity table", () => {
  it("Nothing survived the rewrite", () => {})
})