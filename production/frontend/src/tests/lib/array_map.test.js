import { ArrayMap } from '../../lib/array_map';

describe("Array Map test suite", () => {
  it("initiation", () => {
    const array_map = new ArrayMap([
      [1,1],[1,2],[3,5]
    ]);

    expect(array_map.has(1)).toBeTruthy;
    expect(array_map.has(2)).toBeFalsy;
    expect(array_map.has(3)).toBeTruthy;
    expect(array_map.get(1).length).toBe(2);
    expect(array_map.get(3).length).toBe(1);
    const [one, two] = array_map.get(1);
    expect(one).toBe(1);
    expect(two).toBe(2);
  })

  it("Array Dual set doens't overwrite rather append", () => {
    const array_map = new ArrayMap();

    array_map.set(1, 1);
    array_map.set(1, 2);

    const [one, two] = array_map.get(1); // implicit expectation that range is 2
    expect(one).toBe(1);
    expect(two).toBe(2);
  });

  it("Array Map test Iterator", () => {
    const array_map = new ArrayMap();

    array_map.set(1, "foo");
    array_map.set(1, "bar");
    array_map.set(2, "hello");
    array_map.set(3, "world");

    let iterations = 0;
    for(const _ of array_map){
      iterations++;
    }
    expect(iterations).toBe(3);
  });
})