/** This module is for library functions which doesn't belong in other  */

import { ORDER_STATUS } from "~/lib/constants";
import { ActivityOrder, Dataclass, DeliveryEndpoint, InjectionOrder, Tracer } from "../dataclasses/dataclasses";
import { URL_ACTIVITY_PDF_BASE_PATH, URL_INJECTION_PDF_BASE_PATH, URL_ISOTOPE_PDF_BASE_PATH, URL_SHOP_MANUAL } from "./shared_constants.js";
import { template } from "@babel/core";
import { IsotopeOrderCollection } from "./data_structures/isotope_order_collection";
import { OrdersType } from "./types";

/**
 *
 * @param {Date} d1 - Date 1
 * @param {Date} d2 - Date 2
 * @returns Checks if date 1 and date 2 are the same day
 */
export function compareDates(d1, d2) {
  //Compares if two date objects refer to the same date
  return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
}

export function BooleanMapping(bool){
  return (bool) ? 1 : 0;
}

/** istanbul ignore next */
export function noop(){}

/** Removes an element from a list
 *
 * @param {Array} arr - Array to have an element removed
 * @param {Number} index - Index to be removed
 * @returns {Array}
 */
export function removeIndex(arr, index){
  if (index < 0) return arr;
  return arr.slice(0,index).concat(arr.slice(index + 1 , arr.length));
}

/**
 *
 */
export function getId<T extends Dataclass>(obj: T) : number{
  //@ts-ignore
  return obj.id
}


export function getObjects<K, V>(map: Map<K,V>){
  return (id: K) => map.get(id);
}

export function toMapping(objs){
  const newMap = new Map();
  for(const obj of objs){
    newMap.set(obj.id, obj);
  }
  return newMap;
}

/**
 *
 * @param {DeliveryEndpoint} endpoint
 * @param {Tracer} tracer
 * @param {Date} date
 */
export function openActivityReleasePDF(timeSlotID, date){
  return () => {window.open(`${URL_ACTIVITY_PDF_BASE_PATH}/${timeSlotID}/${
    date.getFullYear()}/${date.getMonth() +1}/${date.getDate()}`)}
}

export function openInjectionReleasePDF(order){
  return () => {window.open(`${URL_INJECTION_PDF_BASE_PATH}/${order.id}`)}
}


export function openIsotopeReleasePDF(collection: IsotopeOrderCollection){
  return () => {
    console.log("Hello world?")
    window.open(`${URL_ISOTOPE_PDF_BASE_PATH}/${collection.delivery.id}/${
      collection.order_date.getFullYear()}/${collection.order_date.getMonth() +1}/${collection.order_date.getDate()}`
    );
  }
}

export function openShopManual(){
  window.open(URL_SHOP_MANUAL)
}

/**
 *
 * @param {InjectionOrder} order
 * @returns {String} the path to the realease note of the injection order
 */
export function InjectionOrderPDFUrl(order){
  return `${URL_INJECTION_PDF_BASE_PATH}/${order.id}`
}

/**
 * Function for creating a maybe monad from a number
 * @param {*} maybeNumber
 * @returns
 */
export function numberfy(maybeNumber){
  if (maybeNumber === "" || maybeNumber === null){
    return ""
  }

  return Number(maybeNumber)
}

export function nullify (input) {
  if(!input) {
    return null;
  }

  return input;
}

/**
 * Compares two object, to see if their state represents the same object, after user input.
 * The primary use case is then you copy an object and you want to check if the copy is dirty.
 *
 * Note this doesn't work very well for nested object for instance:
 *
 * compareLoosely({a : {}},{a : {}}) -> false be2
 *
 * @param {Object} obj_1
 * @param {Object} obj_2
 * @returns {Boolean} - if the objects are equal.
 */
export function compareLoosely(obj_1, obj_2){
  let eq = true;
  for(const key of Object.keys(obj_1)){
    if(key in obj_2){
      // Note here it's rather important to use type coercion
      // as many of these object contains user input.
      // So "2" == 2 is a very common thing.
      eq = eq && obj_1[key] == obj_2[key];
    } else {
      return false;
    }
  }
  return eq;
}

export function isDirty(temporary, source){
  return !compareLoosely(temporary, source)
}

/** Checks if two maps contain equivalent elements
 * @template {K}
 * @template {V}
 * @param {Map<K,V>} map_1
 * @param {Map<K,V>} map_2
 */
export function compareMaps(map_1, map_2){
  if(map_1.size !== map_2.size){
    return false;
  }

  for(const key of map_1.keys()){
    if(!map_2.has(key)){
      return false;
    }
    const obj_1 = map_1.get(key);
    const obj_2 = map_2.get(key);

    if(!compareLoosely(obj_1, obj_2)){
      return false;
    }
  }

  return true;
}

/** Return the id of the time slot
 *
 * @param {ActivityOrder} order
 * @returns {Number}
 */
export function getActiveTimeSlotID(order : ActivityOrder){
  return order.moved_to_time_slot ? order.moved_to_time_slot : order.ordered_time_slot;
}

export function clamp(num: number, min : number, max : number){
  return Math.max(Math.min(num, max), min)
}

export function getWebsocketUrl(){
  return `ws://${window.location.host}/ws/`
}

export function dataClassExists(dc){
  return 0 < dc.id;
}

export function canBeCancelled(order){
  return [ORDER_STATUS.ORDERED,ORDER_STATUS.ACCEPTED].includes(order.status);
}

export function getConstructorArgs(Class){
  return Class.length
}

export function constructBlankArgsArray(Class) : Array<string>{
  const args = [];
  for(let i = 0; i < getConstructorArgs(Class); i++){
    args.push("");
  }

  return args
}

export function* reverse<T>(arr: Array<T>){
  for(let i = arr.length - 1; 0 <= i; i--){
    yield arr[i];
  }
}

/**
 * This is one of those funny times when being a mathematician annoys you.
 * In the group Z mod n, minus -1.., -(n - 1) doesn't exists...
 * THIS SHOULD BE NAMED THE REMAINDER OPERATOR NOT MODULUS!
 */
export function properModulo(a: number, n: number){
  const r = a % n;
  return r < 0 ? r + n : r;
}

export function map<T,U>(fn : (a : T) => U, arr: T[]): U[] {
  return [...arr].map(fn)
}

export function get_minimum_status(orders: OrdersType){
  let minimum_status = ORDER_STATUS.EMPTY;

  for(const order of orders){
    minimum_status = Math.min(minimum_status, order.status);
  }

  return minimum_status;
}
