import { MODELS } from "../dataclasses/dataclasses";

// Stealing code from https://stackoverflow.com/questions/2010892/how-to-store-objects-in-html5-localstorage
export const db = {
  set: function(key, value){
    if (!key || value == undefined) return;
    const Type = this.types[key];

    if (Type === undefined){
      throw `Type of ${key} unknown!`;
    }

    if (Type === Map) {
      value = JSON.stringify(Object.fromEntries(value));
    } else if (typeof value === "object"){
      value = JSON.stringify(value);
    }

    const SetTime = new Date();


    localStorage.setItem(key, value);
    localStorage.setItem("lastUpdated", JSON.stringify(SetTime));

  },
  get: function(key) {
    const Type = this.types[key]

    if (Type === undefined){
      throw `Type of ${key} unknown!`;
    }

    let value = localStorage.getItem(key);

    if (value == null) return null; // Item wasn't found

    switch(Type){
      case Date: {
        const DateStr = JSON.parse(value)
        return new Date(DateStr);
      }
      case Array:
      case Object:
        return JSON.parse(value);
      case Number :
      case String:
        return Type(value);
      case Boolean:
        if (value === "true") {
          return true;
        }
        return false;
      case Map: {
        const TempObject = JSON.parse(value);
        value = new Map();
        for(const [key, val] of Object.entries(TempObject)){
          const MaybeNumberKey = Number(key);
          if (isNaN(MaybeNumberKey)){
            value.set(key, val)
          } else {
            value.set(MaybeNumberKey, val);
          }
        }
        return value
      }
      // This code is unreachable
      default: /* istanbul ignore next */
        return value;
    }

  },
  delete(key) {
    localStorage.removeItem(key)
  },

  // ENSURE THAT THIS IS OBJECT IS UP TO DATE WITH constants.js
  types : {
    today : Date, // DATABASE_TODAY
    lastUpdated : Date, //DATABASE_LAST_UPDATED
    activeTracer : Number, //DATABASE_ACTIVE_TRACER
    isAuth : Boolean, //DATABASE_IS_AUTH
    server_config : Object, //DATABASE_SERVER_CONFIG
    current_user : Object, //DATABASE_USER
    // Admin
    admin_page : String, // DATABASE_ADMIN_PAGE
    // shop
    shopCustomer : Number, // DATABASE_SHOP_CUSTOMER
    shop_active_endpoint : Number,
    shop_order_page : String,
  },

  addType: function(key, typeClass){
    this.types[key] = typeClass;
  }
}
// GOD JAVASCRIPT IS STUPID
for (const keyword of Object.keys(MODELS)) {
  db.types[keyword] = Map;
}
