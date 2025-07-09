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
import { isotopeDeliveryFilter, timeSlotsFilter } from "~/lib/filters";
import { DATA_DELIVER_TIME, DATA_ISOTOPE_PRODUCTION, DATA_PRODUCTION } from "~/lib/shared_constants";


/**
 * @enum
 */
export const PRODUCTION_TYPES = {
  ISOTOPE_PRODUCTION : DATA_ISOTOPE_PRODUCTION,
  PRODUCTION : DATA_PRODUCTION,
  EMPTY : "EMPTY"
};

/**
 * Class that unionizes the types of tracer and istope
 */
export class ProductionReference {
  constructor(id, type){
    this.product_id = id;
    if(Object.values(PRODUCTION_TYPES).includes(type)){
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
      new ProductionReference(productID, PRODUCTION_TYPES.PRODUCTION) :
      new ProductionReference(productID, PRODUCTION_TYPES.ISOTOPE_PRODUCTION);
  }

  to_value(){
    switch(this.type) {
      case PRODUCTION_TYPES.ISOTOPE_PRODUCTION:
        return `i-${this.product_id}`;
      case PRODUCTION_TYPES.PRODUCTION:
        return `t-${this.product_id}`;
      default:
        return "";
    }
  }

  is_isotope(){
    return this.type === PRODUCTION_TYPES.ISOTOPE_PRODUCTION;
  }

  is_tracer(){
    return this.type === PRODUCTION_TYPES.PRODUCTION;
  }

  /** Check if two product references refer to the same product
   *
   * @param {ProductionReference} prod_ref
   * @returns {Boolean}
   */

  equal(prod_ref){
    return this.product_id === prod_ref.product_id && this.type === prod_ref.type;
  }

  /** Check if two product references refer to the different product
   *
   * @param {ProductionReference} prod_ref
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
    case PRODUCTION_TYPES.ISOTOPE_PRODUCTION: { // Note this scope is here to reuse prods variable
      return [...state.isotope_production.values()].filter(
        (ip) => ip.isotope === this.product_id
      );

    }
    case PRODUCTION_TYPES.PRODUCTION: {
      return [...state.production.values()].filter(
        (ap) => ap.tracer === this.product_id
      );
    }
    default:
      return [];
    }
  }


  /**
   *
   * @param {TracershopState} state
   * @param {Number | DeliveryEndpoint} endpointRef
   * @returns {Array<IsotopeDelivery> | Array<ActivityDeliveryTimeSlot>}
   */
  filterDeliveries(state, endpointRef) {
    const endpointID = endpointRef instanceof DeliveryEndpoint ?
        endpointRef.id
      : endpointRef;

    switch (this.type) {
      case PRODUCTION_TYPES.PRODUCTION: {
        return timeSlotsFilter(state, {
          state: state,
          tracerID : this.product_id,
          endpointID : endpointID
        });
      }
      case PRODUCTION_TYPES.ISOTOPE_PRODUCTION: {
        return isotopeDeliveryFilter(state, {
          state : state,
          isotopeID : this.product_id,
          endpointID : endpointID
        });
      }

      default:
        return [];
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
