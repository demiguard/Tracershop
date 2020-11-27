export { CustomerSelect }

class CustomerSelect {
  
  constructor(select, onChangeFunction) {
    select.on('change', onChangeFunction)
    this.select = select[0];
    
  };

  getValue() {
    return this.select.value
  };

}