import React, { Component } from "react";
import propTypes from "prop-types"
import { Form, FormControl, InputGroup } from "react-bootstrap";
import { ClickableIcon } from "../icons";

export { DatabaseField, FIELDS, FieldFrame }

/**
 * The different field types
 * @enum
 */
const FIELDS = {
  charField : "charField",
  intField : "intField",
  foreignKeyField : "foreignKeyField",
}



const fieldChangeFunction = {
  charField : (event) => {},
  intField : (event) => {},
  foreignKeyField : (event) => {},
}


class FieldFrame {
  constructor(type, foreignKeys, foreignKeyDescriptor){
    this.type = type;
    this.foreignKeys = foreignKeys;
    this.foreignKeyDescriptor = foreignKeyDescriptor
  }
}


class DatabaseField extends Component {
  static propTypes = {
    value : propTypes.any.isRequired,
    defaultValue : propTypes.any.isRequired,
    fieldName : propTypes.string.isRequired,
    fieldFrame : propTypes.instanceOf(FieldFrame),
    onChange : propTypes.func.isRequired,
    onReset : propTypes.func.isRequired,
  }


  render(){
    let input;
    switch(this.props.fieldFrame.type) {
      case FIELDS.charField:
        input = <FormControl value={this.props.value} onChange={this.props.onChange}/>
        break;

      case FIELDS.intField:
        input = <FormControl value={this.props.value} onChange={this.props.onChange}/>
        break;

      case FIELDS.foreignKeyField:
        const foreignKeyOptions = []
        for(const [modelID, model] of this.props.fieldFrame.foreignKeys){
          const modelDescriptor = (this.props.fieldFrame.foreignKeyDescriptor === undefined) ?
            modelID : model[this.props.fieldFrame.foreignKeyDescriptor];
          foreignKeyOptions.push(<option value={modelID} key={modelID}>{modelDescriptor}</option>)
        }
        input = (<Form.Select value={this.props.value} onChange={this.props.onChange}>
          {foreignKeyOptions}
        </Form.Select>);
      break;

      default:
        throw "Unknown field type";
    }

    return (
      <InputGroup>
        <InputGroup.Text>{this.props.fieldName}</InputGroup.Text>
        {input}
        {this.props.defaultValue != this.props.value ?
          <InputGroup.Text>
            <ClickableIcon src={"static/images/update.svg"} onClick={this.props.onReset}/>
          </InputGroup.Text> : ""}
      </InputGroup>
    );
  }
}