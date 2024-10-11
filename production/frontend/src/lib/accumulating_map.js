export class AccumulatingMap {
  constructor(inputList){
    this._map = new Map();

    if (inputList !== undefined) for(const [key,value] of inputList){
      this.set(key, value)
    }
  }

  has(key){
    return this._map.has(key);
  }

  get(key, _default){
    if(this._map.has(key)){
      return this._map.get(key);
    } else {
      return _default;
    }
  }

  set(key, value){
    if(this._map.has(key)){
      this._map.set(key, this._map.get(key) + value);
    } else {
      this._map.set(key, value)
    }
  }

  *[Symbol.iterator](){
    for(const [key, value] of this._map.entries()){
      yield [key, value]
    }
  }

}