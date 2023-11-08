/** This module is for library functions which doesn't belong in other  */

import { DeliveryEndpoint, InjectionOrder, Tracer } from "../dataclasses/dataclasses";
import { URL_ACTIVITY_PDF_BASE_PATH, URL_INJECTION_PDF_BASE_PATH } from "./shared_constants";

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

export function getId(obj){
  return obj.id
}

/**
 * 
 * @param {DeliveryEndpoint} endpoint 
 * @param {Tracer} tracer 
 * @param {Date} date 
 */
export function getPDFUrls(endpoint, tracer, date){
  return `${URL_ACTIVITY_PDF_BASE_PATH}/${endpoint.id}/${tracer.id}/${
    date.getFullYear()}/${date.getMonth() +1}/${date.getDate()}`;
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