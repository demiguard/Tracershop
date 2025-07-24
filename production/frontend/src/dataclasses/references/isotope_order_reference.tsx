
import React, { JSX } from "react";
import { CommitButton } from "~/components/injectable/commit_button";
import { DeleteButton } from "~/components/injectable/delete_button";
import { ClickableIcon } from "~/components/injectable/icons";
import { IsotopeOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order";
import { ORDER_STATUS } from "~/lib/constants";
import { DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";
import { ShopActionButtonArgs } from "~/lib/types";

export class IsotopeOrderReference extends Order<IsotopeOrder> {
  constructor(order : IsotopeOrder ){
    super(order);
  }

  get datatype(): string {
    return DATA_ISOTOPE_ORDER;
  }
}
