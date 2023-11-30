/**
 * @jest-environment jsdom
 */

import React from "react";
import { screen, render, cleanup} from "@testing-library/react";
import { Optional } from "~/components/injectable/optional";
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
})