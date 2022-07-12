export { CompareDates, BooleanMapping, noop, autoAddCharacter, addCharacter }


function CompareDates(d1, d2) {
  //Compares if two date objects refer to the same date
  return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
}

function BooleanMapping(bool){
  return (bool) ? 1 : 0
}

function noop(){

}
/**
 * This functions adds a string at certain indexes.
 * This is useable for instance in when users are typing numbers for a time stamp
 * example The user types: 1234 but the format is specified as 12:34
 * @param { Object } event - an react event that caused the parent function to fire
 * @param { String } insert_character - The character inserted at the relevant indexes
 * @param { Set } indexes - An set of numbers where the inserted character
 * @param { String } old_string - This is the old string.
 * @returns { String } - A potential modified string.
 */
function autoAddCharacter(event, insert_character, indexes, old_string){
  const nativeEvent = event.nativeEvent;
  if (nativeEvent.inputType !== "insertText") return event.target.value;
  if (indexes.has(old_string.length) && nativeEvent.data !== insert_character) {
    return old_string + insert_character + nativeEvent.data;
  }
  return event.target.value;
};

/**
 *
 * @param {*} character -
 * @param {String} kw - String
 * @param {Array} indexes - Array of indexes
 * @param {Object} This - Stateholder
 * @returns {CallableFunction} - Function that adds a
 */
function addCharacter(character, kw, indexes, This){
  const returnFunction = (event) => {
      if(event.code == "Backspace") return;
      if(indexes.includes(event.target.value.length)){
        const newState = {...This.state}
        newState[kw] = event.target.value + character;
        This.setState(newState);
      }
    }
  return returnFunction.bind(this);
}