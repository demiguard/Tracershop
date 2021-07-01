export { CustomerSelect }





class CustomerSelect {
  SetCookie() {
    Cookies.set("ActiveCustomer" , $(this).val(), { sameSite: 'Strict'})
  }

  constructor(select, onChangeFunction) {
    const CookieValue = Cookies.get("ActiveCustomer");
    if (CookieValue) {
      select.val(CookieValue);
    }
    select.on('change', onChangeFunction)
    select.on('change', this.SetCookie)
    this.select = select[0];
  };

  getValue() {
    return this.select.value
  };

 

}