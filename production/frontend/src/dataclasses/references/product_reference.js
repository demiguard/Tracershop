/**
 * A Product reference is a reference to something that can be produced.
 * This includes an overlapping reference of the multiple data-classes of
 * * Tracer (activity tracer)
 * * Isotopes
 */

import { Option } from "~/components/injectable/select";
import { ActivityDeliveryTimeSlot, ActivityProduction, DeliveryEndpoint,
  Isotope, IsotopeDelivery, IsotopeProduction, Tracer, TracershopState
} from "~/dataclasses/dataclasses";
import { WEEKLY_REPEAT_CHOICES } from "~/lib/constants";
import { activityOrderFilter, isotopeDeliveryFilter, isotopeOrderFilter, timeSlotsFilter } from "~/lib/filters";
import { DATA_ISOTOPE, DATA_TRACER } from "~/lib/shared_constants";


/**
 * @typedef {Object} ProductTypes
 * @property {typeof DATA_ISOTOPE} ISOTOPE
 * @property {typeof DATA_TRACER} ACTIVITY
 * @property {"EMPTY"} EMPTY
 */

/**
 *
 * @type {ProductTypes}
 * @enum
 */
export const PRODUCT_TYPES = {
  ISOTOPE : DATA_ISOTOPE,
  ACTIVITY : DATA_TRACER,
  EMPTY : "EMPTY"
};

/**
 * Class that unionizes the types of tracer and istope
 */
export class ProductReference {
  constructor(id, type){
    this.product_id = id;
    if(Object.values(PRODUCT_TYPES).includes(type)){
      this.type = type
    } else {
      throw {error : "Unknown production type"}
    }
  }

  static fromValue(value) {
    const is_tracer = value[0] == 't';
    const productID = Number(value.substring(2));

    if (isNaN(productID)){
      throw { error : "Cannot select an unknown production"};
    }

    return is_tracer ?
      new ProductReference(productID, PRODUCT_TYPES.ACTIVITY) :
      new ProductReference(productID, PRODUCT_TYPES.ISOTOPE);
  }

  static fromProduct(product){
    switch(true){
      case product instanceof Tracer:
        return new ProductReference(product.id, PRODUCT_TYPES.ACTIVITY);
      case product instanceof Isotope:
        return new ProductReference(product.id, PRODUCT_TYPES.ISOTOPE);
      default:
        return new ProductReference(-1, PRODUCT_TYPES.EMPTY);
    }
  }

  to_value(){
    switch(this.type) {
      case PRODUCT_TYPES.ISOTOPE:
        return `i-${this.product_id}`;
      case PRODUCT_TYPES.ACTIVITY:
        return `t-${this.product_id}`;
      default:
        return "";
    }
  }

  /**
   *
   * @param {TracershopState} state
   */
  to_product(state){
    switch(this.type){
      case PRODUCT_TYPES.ISOTOPE:
        return state.isotopes.get(this.product_id)
      case PRODUCT_TYPES.ACTIVITY:
        return state.tracer.get(this.product_id)
    }

  }

  is_isotope(){
    return this.type === PRODUCT_TYPES.ISOTOPE;
  }

  is_tracer(){
    return this.type === PRODUCT_TYPES.ACTIVITY;
  }

  /** Gets a delivery initialized
   *
   * @param {Number} endpoint_id
   * @param {Array<ActivityProduction> | Array<IsotopeProduction>} productions
   * @returns
   */
  get_empty_delivery(endpoint_id, productions){
    const productionID = productions.length > 0 ? productions.at(0).id : -1;

    switch (this.type) {
      case PRODUCT_TYPES.ISOTOPE:
        return new IsotopeDelivery(-1, productionID, WEEKLY_REPEAT_CHOICES.ALL, endpoint_id, "");
      case PRODUCT_TYPES.ACTIVITY:
        return new ActivityDeliveryTimeSlot(-1,  WEEKLY_REPEAT_CHOICES.ALL, "", endpoint_id, productionID);
      default:
        return {};
    }
  }

  /** Check if two product references refer to the same product
   *
   * @param {ProductReference} prod_ref
   * @returns {Boolean}
   */

  equal(prod_ref){
    return this.product_id === prod_ref.product_id && this.type === prod_ref.type;
  }

  /** Check if two product references refer to the different product
   *
   * @param {ProductReference} prod_ref
   * @returns {Boolean}
   */
  not_equal(prod_ref){
    return this.product_id != prod_ref.product_id || this.type != prod_ref.type;
  }

  /** Gets existing the production options for the product
    *
    * @param {TracershopState} state
    * @returns {Array<IsotopeProduction> | Array<ActivityProduction>}
    */
  filterProduction(state){
    switch (this.type) {
    case PRODUCT_TYPES.ISOTOPE: { // Note this scope is here to reuse prods variable
      return [...state.isotope_production.values()].filter(
        (ip) => ip.isotope === this.product_id
      );

    }
    case PRODUCT_TYPES.ACTIVITY: {
      return [...state.production.values()].filter(
        (ap) => ap.tracer === this.product_id
      );
    }
    default:
      return [];
    }
  }


  /** Filters the deliveries in the state such that you get the deliveries,
   * from this
   *
   * @param {TracershopState} state
   * @param {Number | DeliveryEndpoint} endpointRef
   * @returns {Array<IsotopeDelivery> | Array<ActivityDeliveryTimeSlot>}
   */
  filterDeliveries(state, endpointRef, day) {
    const endpointID = endpointRef instanceof DeliveryEndpoint ?
        endpointRef.id
      : endpointRef;

    switch (this.type) {
      case PRODUCT_TYPES.ACTIVITY: {
        return timeSlotsFilter(state, {
          state: state,
          tracerID : this.product_id,
          endpointID : endpointID,
          day : day,
        });
      }
      case PRODUCT_TYPES.ISOTOPE: {
        return isotopeDeliveryFilter(state, {
          state : state,
          isotopeID : this.product_id,
          endpointID : endpointID,
          day : day,
        });
      }

      default:
        return [];
    }
  }

  /**
   *
   * @param {TracershopState} state
   * @param {Object} filterArguments
   * @returns
   */
  filterOrders(state, {
    timeSlots
  }) {
    switch (this.type){
      case PRODUCT_TYPES.ACTIVITY:
        return activityOrderFilter(
          state, {
            state : state,
            timeSlots : timeSlots
          }
        );
      case PRODUCT_TYPES.ISOTOPE:
        return isotopeOrderFilter(state, {
          state : state,
          timeSlots : timeSlots,
        });

    }
  }
}

/**
 *
 * @param {Tracer | Isotope} product
 * @returns {Option}
 */
export function productToReferenceOption(product){
      if (product instanceof Tracer){
      return new Option(`t-${product.id}`, product.shortname)
    } else if (product instanceof Isotope) {
      const name = product.metastable ?
          `${product.atomic_letter}-${product.atomic_mass}m`
        : `${product.atomic_letter}-${product.atomic_mass}`;

      return new Option(`i-${product.id}`, `${name}`);
    } else {
      throw { error :
        "Somehow a none isotope or activity tracer ended up as a valid product without a method to be converted to a valid option"
      };
    }
}
