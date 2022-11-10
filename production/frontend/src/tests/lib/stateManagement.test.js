import { changeState, toggleState } from "../../lib/stateManagement";


const start_toggle = false;
const DummyStateHolder = {
  state : {
    dummy_key : "dummy_val",
    dummy_toggle : start_toggle,
  },
  setState: function (state){
    this.state = state
  }
}

const newVal = "NewVal";
const DummyEvent = {
  target : {
    value : newVal
  }
};

test("Test Change State", () => {
  const stateFunction = changeState("dummy_key", DummyStateHolder);
  stateFunction(DummyEvent);
  expect(DummyStateHolder.state.dummy_key).toEqual(newVal);
});

test("Test ToggleState", () => {
  const toggleFunction = toggleState("dummy_toggle", DummyStateHolder);
  toggleFunction({});
  expect(DummyStateHolder.state.dummy_toggle).toEqual(true);
  toggleFunction({});
  expect(DummyStateHolder.state.dummy_toggle).toEqual(false);
  toggleFunction({});
  expect(DummyStateHolder.state.dummy_toggle).toEqual(true);
});
