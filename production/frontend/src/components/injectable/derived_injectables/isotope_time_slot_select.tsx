import React, { ComponentProps } from 'react';
import { Select, toOptions } from '../select';
import { IsotopeDelivery } from '~/dataclasses/dataclasses';

type IsotopeTimeSlotSelectProps = {
  deliveries : Array<IsotopeDelivery>,
} & Omit<ComponentProps<typeof Select>, 'options'>;

export function IsotopeTimeSlotSelect({ deliveries, ...rest }: IsotopeTimeSlotSelectProps){
  //@ts-ignore
  const deliveryOptions = toOptions(deliveries, (delivery: IsotopeDelivery) => delivery.delivery_time, 'id');

  return <Select
    options={deliveryOptions}
    {...rest}
  />
}
