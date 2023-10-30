import React from "react";
import { Form } from "react-bootstrap";
import propTypes from 'prop-types'

export class Option {
  constructor(value, name){
    this.name = name;
    this.value = value;
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
      options.push(toOption(entry))
    }
    return options
  }
}


export function toOptionsFromEnum(obj, namingFunction){
  const options = [];
  for(let [name, id] of Object.entries(obj)){
    if(namingFunction !== undefined){
      name = namingFunction(name, id)
    }

    options.push(new Option(id, name))
  }
  return options;
}


export function Select(props) {
  const newProps = {...props};

  if('canEdit' in props){
    if(!props['canEdit']){
      newProps['disabled'] = true;
      delete newProps['onChange'];
    }
    delete newProps['canEdit'];
  }

  const Options = props.options.map(
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