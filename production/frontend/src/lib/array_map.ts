/**
 * A hash map with chaining
 * Always returns an Array
 * @template K
 * @template V
 */
export class ArrayMap<K,V> {
  #map : Map<K, Array<V>>

  constructor(inputList?: Array<[K,V]>){
    this.#map = new Map()

    if (inputList !== undefined) for(const [key,value] of inputList){
      this.set(key, value)
    }
  }

  get size(){
    return this.#map.size;
  }

  has(key: K){
    return this.#map.has(key);
  }

  get(key: K, _default=undefined) : Array<V>{
    if(this.#map.has(key)){
      return this.#map.get(key);
    } else {
      return _default;
    }
  }

  set(key: K, value: V){
    if(this.has(key)){
      this.get(key).push(value);
    } else {
      this.#map.set(key, [value]);
    }
  }

  keys(){
    return this.#map.keys();
  }

  sortEntries(key: K, compareFunction: (v1 : V, v2: V) => number){
    const value = this.get(key);
    if (value !== undefined){
      return value.sort(compareFunction);
    }
    return undefined;
  }

  /**
 * Implements the iterator protocol for the ArrayMap, allowing the object to be
 * iterable. Yields key-value pairs where the value is an array.
 *
 */
*[Symbol.iterator](): Generator<[K, V[]]> {
    for(const [key,values] of this.#map.entries()){
      yield [key, values];
    }
  }
}
