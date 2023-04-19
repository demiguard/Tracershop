import React, { Component } from "react";
import { Form } from "react-bootstrap";
import styles from "../../css/Navbar.module.css"

import propTypes from 'prop-types'

export { Select }

class Select extends Component {
  static propTypes = {
    label : propTypes.string,
    options : propTypes.arrayOf(propTypes.object).isRequired,
    nameKey : propTypes.string.isRequired,
    valueKey : propTypes.string.isRequired,
    onChange : propTypes.func.isRequired,
    initialValue : propTypes.any,
  }

  static defaultProps = {
    label : "select"
  }

  render(){
    const options = [];
    let initialValue = this.props.initialValue
    for(const option of this.props.options){
      const value = option[this.props.valueKey];
      const name = option[this.props.nameKey];
      if( initialValue === undefined){
        initialValue = value;
      }
      options.push(
        <option value={value} key={value}>{name}</option>
      );
    }


    return (
      <Form.Select
        aria-label={this.props.label}
        onChange={this.props.onChange}
        value={initialValue}
      > {options}
      </Form.Select>
    )
  }

}