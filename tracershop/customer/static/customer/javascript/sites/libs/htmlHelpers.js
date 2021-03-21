export { createElement, dropChildern, auto_char }


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
      let number_of_chars = $(this).val().length;
      
      if (number_of_chars === n  && String.fromCharCode(key.which) !== c){
        let prev_val = $(this).val();
        $(this).val(prev_val + c);
      }
    }
  });
};