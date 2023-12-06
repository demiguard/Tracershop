/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup} from "@testing-library/react";
import { Optional, Options } from "~/components/injectable/optional";
import { Table } from "react-bootstrap";

beforeEach(() => {});
afterEach(() => {cleanup()});

describe("Optional Test suite", () => {
  it("Root component doesn't exists", () => {
    render(<Optional exists={false}>
      <div>This doesn't exists!</div>
    </Optional>);

    expect(screen.queryByText('This doesn\'t exists!')).toBeNull();
  });

  it("Root component exists", () => {
    render(<Optional exists={true}>
      <div>This does exists!</div>
    </Optional>);

    expect(screen.queryByText('This does exists!')).not.toBeNull();
  });

  it("Optional table row", () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td></td>
            <td></td>
          </tr>
          <Optional exists={false}>
            <tr>
              <td></td>
              <td></td>
            </tr>
          </Optional>
        </tbody>
      </Table>);
  });
});

describe("Options test suite", () => {
  it("Options standard use case", () => {
    render(<Options index={0}>
      <div>1</div>
      <div>2</div>
      <div>3</div>
      <div>4</div>
      <div>5</div>
      <div>6</div>
    </Options>);

    expect(screen.getByText("1")).toBeVisible();
    expect(screen.queryByText("2")).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
    expect(screen.queryByText("4")).toBeNull();
    expect(screen.queryByText("5")).toBeNull();
    expect(screen.queryByText("6")).toBeNull();
  });

  it("Options out of bounds", () => {
    render(<Options index={7}>
      <div>1</div>
      <div>2</div>
      <div>3</div>
      <div>4</div>
      <div>5</div>
      <div>6</div>
    </Options>);

    expect(screen.queryByText("1")).toBeNull();
    expect(screen.queryByText("2")).toBeNull();
    expect(screen.queryByText("3")).toBeNull();
    expect(screen.queryByText("4")).toBeNull();
    expect(screen.queryByText("5")).toBeNull();
    expect(screen.queryByText("6")).toBeNull();
  });
});
