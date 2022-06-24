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
    } else {
      value = new Type(value);
    }

    return value;
  },

  // ENSURE THAT THIS IS OBJECT IS UP TO DATE WITH constants.js
  types : {
    today : Date, // DATABASE_TODAY
    lastUpdated : Date, //DATABASE_LAST_UPDATED
    activeTracer : Number, //DATABASE_ACTIVE_TRACER
    isAuth : Boolean, //DATABASE_IS_AUTH
    serverConfig : Object, //DATABASE_SERVER_CONFIG
    // Maps
    address : Map, // DATABASE_ADDRESS
    customer : Map, // DATABASE_CUSTOMER
    database : Map, // DATABASE_DATABASE
    deliverTimes : Map, //DATABASE_DELIVERTIME
    employee : Map, //DATABASE_EMPLOYEE
    isotopes : Map, //DATABASE_ISOTOPE
    orders : Map, //DATABASE_ACTIVITY_ORDER
    run : Map, //DATABASE_PRODUCTION
    t_orders : Map, //DATABASE_INJECTION_ORDER
    tracer : Map, //DATABASE_TRACER
    vial    : Map, //DATABASE_VIAL
  },

  addType: function(key, typeClass){
    this.types[key] = typeClass;
  }
}