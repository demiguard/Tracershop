import { HTMLTAG } from "./Constants.js"
export { createElement, constructElement, constructElementID, constructElementClassList, dropChildern, auto_char, MaxCharInField, destroyActiveDialog}


// This module contains functions that are independant on 



function createElement(div, content,id, identifyer, classList) {
  var element = document.createElement(identifyer);
  for(let i = 0; i < classList.length; i++) {
    const classToBeAdded = classList[i];
    element.classList.add(classToBeAdded)
  }
  if (id != ''){
    element.id=id;
  }
  element.innerHTML = content;
  div.append(element);
  return element;
};

function dropChildern(div) {
  div.children().remove()
};

function auto_char(field, c, n) {
  const BACKSPACE_KEY = 8;
  
  field.bind('keypress', function(key) {
    
    if (key.which !== BACKSPACE_KEY) { 
      //This check is redudant since backspace event does register backspace
      //you need to change the event to keyup / keydown in order to get that
      let number_of_chars = $(this).val().length;
      
      if (number_of_chars === n  && String.fromCharCode(key.which) !== c){
        let prev_val = $(this).val();
        $(this).val(prev_val + c);
      }
    }
  });
};

function MaxCharInField(field, maxLength) {
  const BACKSPACE_KEY = 8;
  field.bind('keyup', function(key) {
    if (key.which !== BACKSPACE_KEY) {
      var stringInField = $(this).val();
      if (stringInField.length > maxLength) {
        var substring = stringInField.substring(0, maxLength);
        $(this).val(substring);
        $(this).css("background-color", "#FFBBBB");
      }
      else {
        $(this).css("background-color", "#FFFFFF");
      }
    } else {
      $(this).css("background-color", "#FFFFFF");
    }
  });
};

function destroyActiveDialog() {
  $(".ui-dialog-content").dialog("close");
  $(".ui-dialog-content").remove();
};

function constructElement(typeOfElement, content, id, classList) {
  //Holy shit javascript is stupid
  //Like how fucking bad can this be
  // I wanna go back to python
  if (content === undefined ) content = "";
  if (id === undefined ) id      = "";
  if (classList === undefined ) classList = [];
  
  const htmlObejct = $(`<${typeOfElement}>`) //Note `` operates different that '' or "" yeah - FUCK JAVASCRIPT
  if (id != "") htmlObejct.attr(id, id);
  if (content != "") htmlObejct.text(content);

  for (var i = 0; i < classList.length; i++) {
    // need this context, so no for each #fuck javascript
    htmlObejct.addClass(classList[i]);
  }
  return htmlObejct
}


//Wrappers for overloading
function constructElementID(typeOfElement, id){
  return constructElement(typeOfElement, "", id)
}

function constructElementClassList(typeOfElement, classList){
  return constructElement(typeOfElement, "", "", classList)
}


function ObjectFactory(Blueprint) {
  htmlObejct = $(`<${Blueprint[HTMLTAG]}>`)

}