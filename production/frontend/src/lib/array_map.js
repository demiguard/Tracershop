/**
 * A hash map with chaining
 * Always returns an Array
 * @template K
 * @template V
 */
export class ArrayMap {
  /**@type {Map<K, Array<V>>} */ _map

  constructor(inputList){
    this._map = new Map()

    if (inputList !== undefined) for(const [key,value] of inputList){
      this.set(key, value)
    }
  }

  has(key){
    return this._map.has(key);
  }

  /** Gets an
   * @template D - Type of the default value
   * @param {K} key Key in the key/value par
   * @param {D} _default Default value returned if the map doesn't have the key
   * Defaults to undefined, which is also the default for Map
   * @returns {Array<V> | D}
   */
  get(key, _default=undefined){
    if(this._map.has(key)){
      return this._map.get(key);
    } else {
      return _default;
    }
  }

  set(key, value){
    if(this.has(key)){
      this.get(key).push(value)
    } else {
      this._map.set(key, [value])
    }
  }

  keys(){
    return this._map.keys()
  }

  sortEntries(key, compareFunction){
    const value = this.get(key);
    if (value !== undefined){
      return value.sort(compareFunction)
    }
    return undefined;
  }

  *[Symbol.iterator]() {
    for(const [key,value] of this._map){
      yield [key, value]
    }
  }
}
