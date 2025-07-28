import { ActivityOrder, InjectionOrder, IsotopeOrder } from "~/dataclasses/dataclasses"


export interface ShopActionButtonArgs {
  label?: string,
  validate: () => boolean | [ boolean, any ],
  callback?: (any) => void,
  canEdit: boolean = false,
  is_dirty: boolean
}

export type OrderType = IsotopeOrder | ActivityOrder | InjectionOrder