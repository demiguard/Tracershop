/**
 * @jest-environment jsdom
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { act, screen, render, cleanup, fireEvent } from "@testing-library/react";
import userEvent from '@testing-library/user-event'

import { HoverBox } from "../../../components/injectable/hover_box.js"


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

describe("Injectable HoverBox", () => {
  it("Black Box test, no hover", () => {
    const BaseMessage = "This is a message"
    const HoverMessage = "This is a hover message"

    const BaseDiv = <div>{BaseMessage}</div>;
    const HoverDiv = <div>{HoverMessage}</div>

    render(<HoverBox
      Base={BaseDiv}
      Hover={HoverDiv}
    />);
    expect(screen.getByText(BaseMessage)).toBeVisible();
    expect(screen.queryByText(HoverMessage)).not.toBeVisible();
  });

  it("Black Box test, hover", async () => {
    const BaseMessage = "This is a message"
    const HoverMessage = "This is a hover message"

    const BaseDiv = <div>{BaseMessage}</div>;
    const HoverDiv = <div>{HoverMessage}</div>

    render(<HoverBox
      Base={BaseDiv}
      Hover={HoverDiv}
    />, {target : container});

    await act(async () => {
      await userEvent.hover(screen.getByText(BaseMessage));
    });
    expect(screen.getByText(BaseMessage)).toBeVisible();
    expect(screen.queryByText(HoverMessage)).toBeVisible();

    await act(async () => {
      await userEvent.unhover(screen.getByText(BaseMessage));
    })
    expect(await screen.findByText(BaseMessage)).toBeVisible();
    expect(screen.queryByText(HoverMessage)).not.toBeVisible();
  });
});
