export { CustomerSelect }

class CustomerSelect {
  constructor(select, onChangeFunction) {
    select.on('change', onChangeFunction)
  };

}