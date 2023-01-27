import {
  DATABASE_ACTIVITY_ORDER, DATABASE_CLOSEDDATE, DATABASE_CUSTOMER, DATABASE_DELIVER_TIME, DATABASE_EMPLOYEE,
  DATABASE_INJECTION_ORDER, DATABASE_ISOTOPE, DATABASE_PRODUCTION, DATABASE_TRACER, DATABASE_VIAL, JSON_ACTIVITY_ORDER,
  JSON_CLOSEDDATE, JSON_CUSTOMER, JSON_DELIVERTIME, JSON_EMPLOYEE, JSON_INJECTION_ORDER, JSON_ISOTOPE, 
  JSON_RUN, JSON_TRACER, JSON_VIAL } from "./constants";

// Stealing code from https://stackoverflow.com/questions/2010892/how-to-store-objects-in-html5-localstorage
export var db = {
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

    var value = localStorage.getItem(key);

    if (value == null) return null; // Item wasn't found

    if (Type === Date){
      const Datestr = JSON.parse(value)
      value = new Date(Datestr);
    } else if(Type === Array || Type === Object){
      value = JSON.parse(value);
    } else if( Type === Number || Type === String){
      value = Type(value);
    } else if (Type === Boolean) { // special case is needed since Boolean("false") -> true
      if (value === "true") return true;
      return false;
    } else if (Type === Map) {
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
    }

    return value;
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
    user : Object, //DATABASE_USER
    // Admin
    adminPage : String, // DATABASE_ADMIN_PAGE
    // shop
    shopCustomer : Number, // DATABASE_SHOP_CUSTOMER

    // Maps
    address : Map, // DATABASE_ADDRESS
    closeddate : Map, // DATABASE_CLOSEDDATE
    customer : Map, // DATABASE_CUSTOMER
    database : Map, // DATABASE_DATABASE
    deliverTimes : Map, //DATABASE_DELIVERTIME
    employee : Map, //DATABASE_EMPLOYEE
    isotopes : Map, //DATABASE_ISOTOPE
    orders : Map, //DATABASE_ACTIVITY_ORDER
    run : Map, //DATABASE_PRODUCTION
    t_orders : Map, //DATABASE_INJECTION_ORDER
    tracer : Map, //DATABASE_TRACER
    tracer_mapping : Map, //DATABASE_TRACER_MAPPING
    vial    : Map, //DATABASE_VIAL
  },

  addType: function(key, typeClass){
    this.types[key] = typeClass;
  }
}

/**
 * Maps the JSON keywords to their Database variants
 * @param {String} JSONName - JSON_XXX constant found in constants.js
 * @returns {String} - LocalStorage Keyword
 * @throws "Unknown JSON name" on unknown input
 */
export function MapDataName(JSONName){
  // A more elegant solution would be to create a object with all the keys HOWEVER,
  // Because javascript is a fucking STUPID language, you cannot initialize an object with variables or constants
  if (JSONName == JSON_ACTIVITY_ORDER) {return DATABASE_ACTIVITY_ORDER};
  if (JSONName == JSON_CUSTOMER) {return DATABASE_CUSTOMER;}
  if (JSONName == JSON_DELIVERTIME){return DATABASE_DELIVER_TIME;}
  if (JSONName == JSON_EMPLOYEE){return DATABASE_EMPLOYEE;}
  if (JSONName == JSON_INJECTION_ORDER){return DATABASE_INJECTION_ORDER;}
  if (JSONName == JSON_ISOTOPE){return DATABASE_ISOTOPE;}
  if (JSONName == JSON_RUN){return DATABASE_PRODUCTION;}
  if (JSONName == JSON_TRACER){return DATABASE_TRACER;}
  if (JSONName == JSON_VIAL){return DATABASE_VIAL;}
  if (JSONName == JSON_CLOSEDDATE) {return DATABASE_CLOSEDDATE;}

  throw `Unknown JSON Name ${JSONName}`;
}
