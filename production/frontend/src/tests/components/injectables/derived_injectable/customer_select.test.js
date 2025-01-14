/**
 * @jest-environment jsdom
 */

import React, {useState} from "react";

import { screen, render, cleanup } from "@testing-library/react";
import { jest } from '@jest/globals';
import { CustomerSelect } from "~/components/injectable/derived_injectables/customer_select";

import { setStateToEvent } from '~/lib/state_management';

import { DATA_CUSTOMER } from "~/lib/shared_constants";
import { testState } from "~/tests/app_state";

beforeEach(() => {

});

afterEach(() => {
  cleanup();
});

const mockSetCustomer = jest.fn((val) => val);

function StateHolder(){
  const [customer, _setCustomer] = useState(1);

  function setCustomer(val){
    mockSetCustomer(val)
    _setCustomer(val)
  }

  return <CustomerSelect
    customers={testState.customer}
    value={customer}
    onChange={setStateToEvent(setCustomer)}
  />
}

describe("Customer Select test suite" ,() => {
  it("Standard Render test", () => {
    render(<StateHolder/>)

    for(const customer of testState[DATA_CUSTOMER].values()){
      expect(screen.getByText(customer.short_name));
    }
  })
})
