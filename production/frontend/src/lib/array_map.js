
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
    return this._map.has(key)
  }

  get(key){
    return this._map.get(key)
  }


  set(key, value){
    if(this.has(key)){
      this.get(key).push(value)
    } else {
      this._map.set(key, [value])
    }
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        for(const [key,value] of this._map){
          return { value: [key, value], done: false}
      }
      return {done : true}
    }
  }
  }
}