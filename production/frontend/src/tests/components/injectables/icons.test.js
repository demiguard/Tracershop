/**
 * @jest-environment jsdom
 */

import React from "react";
import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client";
import { screen, render, cleanup, fireEvent, getByAltText } from "@testing-library/react";
import userEvent from '@testing-library/user-event'

import { ClickableIcon, StatusIcon } from "../../../components/injectable/icons.js";

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

const dummyClickable = jest.fn(() => {})

describe("Clickable icon tests", () => {
  it("Black Block render test", () => {
    const url = "dummy/url"
    const altText = "altDummy";
    const RenderedIcon = render(<ClickableIcon
      src={url}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    expect(image).toHaveAttribute("src", url)
  })

  it("Black Block render click", async () => {
    const url = "dummy/url"
    const altText = "altDummy";
    const RenderedIcon = render(<ClickableIcon
      src={url}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    await fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  })
})

describe("Status icon tests", () => {
  it("Black Block render test", () => {
    const url = "/static/images/clipboard1.svg"
    const altText = "altDummy";
    const RenderedIcon = render(<StatusIcon
      status={1}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    expect(image).toHaveAttribute("src", url)
  })

  it("Black Block render click", async () => {
    const url = "dummy/url"
    const altText = "altDummy";
    const RenderedIcon = render(<StatusIcon
      status={1}
      altText={altText}
      onClick={dummyClickable}
      label={"label"}
    />)
    const image = screen.getByAltText(altText);

    await fireEvent(image, new MouseEvent('click', {bubbles: true, cancelable: true}));

    expect(dummyClickable).toHaveBeenCalled();
  })

  it("Status tests", () => {
    expect(StatusIcon.statusImages(1)).toEqual("/static/images/clipboard1.svg");
    expect(StatusIcon.statusImages(2)).toEqual("/static/images/clipboard2.svg");
    expect(StatusIcon.statusImages(3)).toEqual("/static/images/clipboard3.svg");
    expect(StatusIcon.statusImages(0)).toEqual("/static/images/clipboard0.svg");
    expect(() => StatusIcon.statusImages(235)).toThrow("Unknown status");
  });
})