import React from "react";
import { Form } from "react-bootstrap";
import propTypes from 'prop-types'
import { InputSelect } from "~/components/injectable/input_select";

/**
 * Class representing an option in a HTML Select where this object is converted
 * to: \<option value={this.value}\>{this.name}\<option/\>
 *
 * @param {*} value
 * @param {*} name
 */
export class Option {
  /**
   *
   */
  constructor(value, name){
    this.value = value;
    this.name = name;
  }
}

export function toOptions(iterable, nameKey='name', valueKey = 'id'){
  function toOption(entry){
    const name = (typeof nameKey === 'function') ?
                        nameKey(entry)
                      : entry[nameKey]
    return new Option(entry[valueKey], name)
  }

  const options = [];
  if (iterable instanceof Map) {
    for(const entry of iterable.values()){
      options.push(toOption(entry));
    };
  return options
  } else if (iterable instanceof Array) {
    return iterable.map(toOption);
  } else {
    for(const entry of iterable){
      options.push(toOption(entry));
    }
    return options;
  }
}


export function toOptionsFromEnum(obj, namingFunction){
  const options = [];
  for(let [name, id] of Object.entries(obj)){
    if(namingFunction !== undefined){
      name = namingFunction(name, id);
    }

    options.push(new Option(id, name));
  }
  return options;
}

/**
 *
 * @param {Array<Option>} props.options
 * @returns
 */
export function Select(props) {
  const {canEdit=true, options, ...newProps} = props;

  if(!canEdit){
      newProps['disabled'] = true;
      delete newProps['onChange'];
    }

  if(options.length > 10){
    return <InputSelect {...props}/>
  }

  const Options = options.map(
    (/** @type {Option} */option) => <option value={option.value} key={option.value}>
                  {option.name}
                </option>);

  if(props.options.length <= 1) {
    newProps['disabled'] = true;
  }
  delete newProps['options'];

  return (<Form.Select{...newProps}> {Options}</Form.Select>);
}

Select.propType = {
  options : propTypes.arrayOf(Option).isRequired,
  canEdit : propTypes.bool,
}