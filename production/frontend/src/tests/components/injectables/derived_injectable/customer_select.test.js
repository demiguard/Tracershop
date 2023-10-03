/**
 * @jest-environment jsdom
 */

import React, {useState} from "react";
import { act } from "react-dom/test-utils"
import { screen, render, cleanup, fireEvent } from "@testing-library/react";
import { jest } from '@jest/globals'
import { CustomerSelect } from "../../../../components/injectable/derived_injectables/customer_select";
import { customers } from "../../../test_state/customers";
import { setStateToEvent } from '../../../../lib/state_management'
import { deliveryEndpoints } from "../../../test_state/delivery_endpoints";
import { activityDeliveryTimeSlots } from "../../../test_state/activity_delivery_time_slots";
import { JSON_CUSTOMER } from "../../../../lib/constants";
import { AppState } from "../../../app_state";


let websocket = null;
let container = null;
let props = null;

beforeEach(() => {
  props=AppState
  container = document.createElement("div");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear()
  if(container != null) container.remove();
  container = null;
  props=null
});

const mockSetCustomer = jest.fn((val) => val);

function StateHolder(){
  const [customer, _setCustomer] = useState(1);

  function setCustomer(val){
    mockSetCustomer(val)
    _setCustomer(val)
  }

  return <CustomerSelect
    customers={props[JSON_CUSTOMER]}
    value={customer}
    onChange={setStateToEvent(setCustomer)}
  />
}

describe("Customer Select test suite" ,() => {
  it("Standard Render test", () => {
    render(<StateHolder/>)

    for(const customer of props[JSON_CUSTOMER].values()){
      expect(screen.getByText(customer.short_name));
    }

  })
})
