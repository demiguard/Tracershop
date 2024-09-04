import React from 'react';
import { FormControl } from "react-bootstrap";
import { Select, toOptions } from '~/components/injectable/select';

export class DatabaseField {
  constructor(name){
    this.name = name;
  }

  jsx(value, setter){
    return <FormControl/>;
  }
};

export class CharField extends DatabaseField { }
export class DateField extends DatabaseField { }
export class DateTimeField extends DatabaseField { }
export class TimeField extends DatabaseField { }
export class BooleanField extends DatabaseField { }
export class IntField extends DatabaseField { }
export class FloatField extends DatabaseField { }
export class IPField extends DatabaseField { }
export class ForeignField extends DatabaseField {
  constructor(name, related_to){
    super(name);
    this.related_to = related_to;
  }

  jsx(value, setter, rawOptions){
    function toString(entry) {
      for(const key of Object.keys(entry)){
        if(/name/.test(key)){
          return entry[key];
        }
      }

      return String(entry['id']);
    }

    const options = toOptions(rawOptions, toString, 'id')

    return <Select
      options={options}
      value={value}
    />

  }
}
