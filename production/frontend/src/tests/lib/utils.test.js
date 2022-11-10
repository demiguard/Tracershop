import { BooleanMapping, CompareDates, removeIndex } from "../../lib/utils"

test("Compare Dates Tests", () => {
  const date_1 = new Date(2011,10,30,11,30,22);
  const date_2 = new Date(2011,10,30,12,30,22);
  const date_3 = new Date(2011,10,29,12,30,22);
  const date_4 = new Date(2011,10,29,11,30,22);
  const date_5 = new Date(2011,9,30,11,30,22);
  const date_6 = new Date(2012,10,30,11,30,22);

  expect(CompareDates(date_1, date_1)).toBeTruthy();
  expect(CompareDates(date_1, date_2)).toBeTruthy();
  expect(CompareDates(date_3,date_4)).toBeTruthy()
  expect(CompareDates(date_1, date_3)).toBeFalsy();
  expect(CompareDates(date_1, date_5)).toBeFalsy();
  expect(CompareDates(date_1, date_6)).toBeFalsy();
});

test("BooleanMapping Tests", () => {
  expect(BooleanMapping(true)).toEqual(1);
  expect(BooleanMapping(false)).toEqual(0);
  expect(BooleanMapping("Sting")).toEqual(1);
  expect(BooleanMapping("")).toEqual(0);
});

test("RemoveIndex Tests", () => {
  expect(removeIndex([1,2,3,4,5], -1)).toEqual([1,2,3,4,5])
  expect(removeIndex([1,2,3,4,5], 0)).toEqual([2,3,4,5])
  expect(removeIndex([1,2,3,4,5], 1)).toEqual([1,3,4,5])
  expect(removeIndex([1,2,3,4,5], 2)).toEqual([1,2,4,5])
  expect(removeIndex([1,2,3,4,5], 3)).toEqual([1,2,3,5])
  expect(removeIndex([1,2,3,4,5], 4)).toEqual([1,2,3,4])
  expect(removeIndex([1,2,3,4,5], 5)).toEqual([1,2,3,4,5])
  expect(removeIndex([1,2,3,4,5], 6)).toEqual([1,2,3,4,5])
})