export class DefaultMap<K,V> {
  value_constructor: () => V
  map : Map<K,V>

  constructor(value_constructor: () => V){
    this.value_constructor = value_constructor
    this.map = new Map();
  }

  get(key: K){
    if(!this.map.has(key)) {
      this.map.set(key, this.value_constructor())
    }

    return this.map.get(key);
  }

  size(){
    return this.map.size;
  }

  // I should
  *[Symbol.iterator](){
    for(const value of this.map){
      yield value;
    }
  }


}