import { ActivityDeliveryTimeSlot, IsotopeDelivery } from "~/dataclasses/dataclasses";
import { WEEKLY_REPEAT_CHOICES } from "../constants";
import { getDay, getWeekNumber } from "../chronomancy";

/**
 * An interface for a bit chain. I.E an encoded int with an evaluate function
 */
export class BitChain {
  _chain : number

  constructor(){
    this._chain = 0;
  }

  /**
   * Function that evau
   * @returns {Boolean}
   */
  eval(date : Date) :boolean {
    throw "Virtual Function"
  }
}

export class TimeSlotBitChain extends BitChain {
  /**@type {Number} 0000000 - 0000000 first seven bits are the days in odd  */ #chain

  /**
   * A data structure for evaluating if you can order at a date determined by
   * time slots.
   * @param {Array<ActivityDeliveryTimeSlot, IsotopeDelivery>} timeSlots - Time Slots determining
   * the bit chains
   * @param {TracershopState} state - All productions as
   * time slot refer to a production.
   */
  constructor(timeSlots, state){
    super();
    this.#chain = 0;

    // this doesn't scale...
    for(const timeSlot of timeSlots){
      if(timeSlot instanceof ActivityDeliveryTimeSlot){

        const production = state.production.get(timeSlot.production_run);

        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.ODD){
          this.#add_odd_weekday(production.production_day);
        }

        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.EVEN){
          this.#add_even_weekday(production.production_day);
        }
      } else if(timeSlot instanceof IsotopeDelivery){
        const production = state.isotope_production.get(timeSlot.production);

        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.ODD){
          this.#add_odd_weekday(production.production_day);
        }
        if(timeSlot.weekly_repeat != WEEKLY_REPEAT_CHOICES.EVEN){
          this.#add_even_weekday(production.production_day);
        }
      }
    }
  }

  eval(date: Date){
    const oddWeekNumber = (getWeekNumber(date) % 2) == 1
    const day = getDay(date);

    return !!(this.#chain & (1 << (day + Number(oddWeekNumber) * 7)))
  }

  #add_even_weekday(day){
    this.#chain = this.#chain | (1 << day + 7);
  }

  #add_odd_weekday(day){
    this.#chain = this.#chain | (1 << day);
  }

  get chain() {
    return this.#chain
  }

  set chain(newChain) {
    this.#chain = newChain
  }
}

//#region Production Bit chain
export class ProductionBitChain extends BitChain {

  /**
   * A data structure for figuring out if tracer is being produced at a day.
   * @param {Map<Number, ActivityProduction>} productions
   */
  constructor(productions){
    super()


    for(const production of productions.values()){
      this._chain = this._chain | (1 << production.production_day);
    }
  }

  eval(date: Date){
    const day = getDay(date);

    return !!(this._chain & (1 << day))
  }
}
