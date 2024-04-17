import React, {useState, useRef} from "react";
import { FormControl } from "react-bootstrap";
import { Optional } from "~/components/injectable/optional";
import { Option } from "~/components/injectable/select";
import { useContainerDimensions } from "~/effects/dimensions";


function InputOption({option, onOptionClick}){
  const [Hovered, setHovered] = useState(false);

  function onHover(){

  }
  function onLeaveHover(){

  }


  return <div key={option.value}>{option.name}</div>
}

/**
 *
 * @param {{
 *  options : Array<Option>
 * }} props
 * @returns
 */
export function InputSelect(props){
  const {options, value, onChange,...rest} = props;
  const ref = useRef(null);
  const {width} = useContainerDimensions(ref)

  const [userInput, setUserInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  function onOptionClick(option){

  }

  const inputRegex = new RegExp(userInput.toLocaleLowerCase());
  const validOptions = options.filter(
    option => {
      return (!!option.value) && (inputRegex.test(option.name.toLocaleLowerCase()) || !userInput);}
  ).map(
    option => {
      return <InputOption
                onOptionClick={onOptionClick}
                option={option}
             />
    }
  )

  function onFocus(){
    setIsFocused(true);
  }

  function onBlur(){
    setIsFocused(false);
  }

  const OptionsHTML = (<div  style={{
    position : "relative",
    width : "0px",
    height : "0px",
  }}>
      <div style={{
        width : `${width}px`,
        background : "white",
        border : "1px",
        borderStyle : "solid",
        borderRadius : "5px",
        //padding : "5%",
      }}>
        {validOptions}
      </div>
    </div>);

  return (
  <div>
    <FormControl
      ref={ref}
      onFocus={onFocus}
      onBlur={onBlur}
      value={userInput}
      onChange={event => (setUserInput(event.target.value))}
      {...rest}
      />
    <Optional exists={isFocused}>
      {OptionsHTML}
    </Optional>
  </div>);
}