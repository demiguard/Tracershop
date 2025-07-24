import { ActivityOrder, InjectionOrder, IsotopeOrder } from "~/dataclasses/dataclasses"


export interface ShopActionButtonArgs {
  label?: string,
  validate: () => Boolean | [ Boolean | any ],
  callback?: () => any,
  canEdit: Boolean = false,
  is_dirty: Boolean
}

export type OrderType = IsotopeOrder | ActivityOrder | InjectionOrder