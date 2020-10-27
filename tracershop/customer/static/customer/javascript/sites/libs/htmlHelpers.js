export { createElement, dropChildern }


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