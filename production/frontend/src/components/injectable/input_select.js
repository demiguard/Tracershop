import React, {useState, useRef, useEffect} from "react";
import { Form, InputGroup, Row } from "react-bootstrap";
import { Optional } from "~/components/injectable/optional";
import { RelativeAnchor } from "~/components/injectable/relative_anchor";
import { Option } from "~/components/injectable/select";
import { useContainerDimensions } from "~/effects/dimensions";
import { escapeInputString } from "~/lib/formatting";


function InputOption({style, option, onOptionClick}){
  const [styleState, setStyleState] = useState({
    paddingLeft  : "12px",
    paddingRight : "12px",
    ...style
  });

  function onHover(){
    setStyleState(oldStyle => {
      return {
        ...oldStyle,
        background : "#bdfffd"
      }});
  }

  function onLeaveHover(){
    setStyleState(oldStyle => {
      return {
        ...oldStyle,
        background : "#ffffff"
      }});
  }

  return <div
    onMouseEnter={onHover}
    onMouseLeave={onLeaveHover}
    // Very import that you have onMouseDown and not on click, otherwise the
    // onBlur from Parent triggers first and then this component does exists and
    // therefore can call this function!
    onMouseDown={() => {onOptionClick(option)}}
    style={styleState}>
      {option.name}
    </div>;
}

/**
 *
 * @param {{
 *  options : Array<Option>
 *  value : Number
 * }} props
 * @returns
 */
export function InputSelect(props){
  const {options, value, onChange, canEdit=true,...rest} = props;
  const optionMap = new Map();
  for(const option of options){
    optionMap.set(option.value, option.name)
  }

  if(!canEdit){
    rest['disabled'] = true
  }

  const initial_userInput = optionMap.has(value) ? optionMap.get(value) : "";

  const ref = useRef(null);
  const {width, height, border, padding} = useContainerDimensions(ref)

  const iconSize = 18; // pixels
  const [userInput, setUserInput] = useState(initial_userInput);
  const [filterRegex, setFilterRegex] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(function updateUserInputFromValue(){
    const initial_userInput = optionMap.has(value) ? optionMap.get(value) : "";
    setUserInput(initial_userInput);
  }, [value]);

  const inverseMapping = new Map()
  for(const option of options){
    inverseMapping.set(option.name.toLocaleLowerCase(), option.value);
  }

  function onOptionClick(option){
    onChange({target : {value: option.value}});
  }

  const inputRegex = new RegExp(filterRegex);
  const validOptions = options.filter(
    option => {
      return (!!option.value) && (inputRegex.test(option.name.toLocaleLowerCase()) || !userInput);}
  ).map(
    option => {
      return <InputOption
                key={option.value}
                onOptionClick={onOptionClick}
                option={option}
             />
    }
  );

  function updateUserInput(event){
    const value = event.target.value;
    setUserInput(value);
    const lowerCaseValue = escapeInputString(value).toLocaleLowerCase();
    setFilterRegex(lowerCaseValue);
    if(inverseMapping.has(lowerCaseValue)){
      onChange({target: {value : inverseMapping.get(lowerCaseValue)}});
    }
  }

  function onFocus(){
    setIsFocused(true);
  }

  function onBlur(){
    setIsFocused(false);
  }

  const OptionsHTML = (
    <div
      style={{
        zIndex : 2,
        position: "relative",
        marginTop : "2px",
        width : `${width}px`,
        background : "white",
        borderColor : "#ced4da",
        border : "2px",
        borderStyle : "solid",
        borderRadius : "3px",
      }}>
      {validOptions}
    </div>
  );

  const left_padding = width - padding.left - iconSize;
  const top_padding = height - padding.bottom;

  const optionButtonLabel = 'aria-label' in rest ? rest['aria-label'] + "-options" : 'options';

  return (
    <div
    style={{ flex : "min-content" }}
    >
      <Form.Control
        ref={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        value={userInput}
        onChange={updateUserInput}
        {...rest}
      />
      <Optional exists={canEdit}>
        <RelativeAnchor>
          <img
            aria-label={optionButtonLabel}
            onClick={() => {
              if(!isFocused && canEdit){
                ref.current.focus();
              }
            }}
            src="static/images/arrow_down.svg"
            style={{
              height : `${iconSize}px`,
              width :  `${iconSize}px`,
              position : "relative",
              left : `${left_padding}px`,
              top : `-${top_padding}px`,
            }}
            />
        </RelativeAnchor>
        <Optional exists={isFocused}>
          <RelativeAnchor>
            {OptionsHTML}
          </RelativeAnchor>
        </Optional>
      </Optional>
  </div>);
}