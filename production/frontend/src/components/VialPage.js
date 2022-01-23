import { ajax } from "jquery";
import React, {Component,} from "react";
import { Container, Table, Row, Col, Button } from "react-bootstrap";
import { JSON_CUSTOMER, JSON_VIALS } from "./lib/constants";
import { parseDate, parseDateToDanishDate, ParseJSONstr } from "./lib/formatting";
import { autoAddCharacter } from "./lib/utils";

export {VialPage}

/**
 * Enum for different sorting options for vial table
 * @readonly
 * @enum {number}
 */
const SearchOptions = {
  ID: 0,
  CHARGE : 1,
  DATE : 2,
  TIME : 3,
  VOLUME : 4,
  ACTIVITY : 5,
  OWNER : 6,
  ORDER : 7,
}


class VialPage extends Component {
  constructor(props){
    super(props)
    this.state = {
      filterCustomer   : "",
      filterBatch      : "",  
      filterSearchDate : "",

      SearchPattern  : SearchOptions.DATE,
      InvertedSearch : true,

      vials : new Map(),
      customers : new Map(),
    }
    ajax({
      url:"api/getVialRange",
      type:"get"
    }).then((data) => {
      const newVialMap = new Map();
      if (data[JSON_VIALS]) for (const vialString of data[JSON_VIALS]) {
        const vial = ParseJSONstr(vialString);
        newVialMap.set(vial.ID, vial);
      }
      
      const newCustomerMap = new Map();
      if (data[JSON_CUSTOMER]) for (const customerString of data[JSON_CUSTOMER]) {
        const customer = ParseJSONstr(customerString);
        newCustomerMap.set(customer.CustomerNumber, customer);
      }

      this.setState({
        vials : newVialMap,
        customers : newCustomerMap,
      });
    })
  }

  /**
   * This function handles search button, being pressed
   * Functionality is sending a request to the backend and updating Vials on response.
   */
  dateSearch(){
    console.log("Hello world");

    var parsedDate;
    parsedDate = parseDate(this.state.filterSearchDate);
    try {

    } catch {
      //TODO Error handling
      console.log("caught Error");
      return;
    }
    
    const year  = Number(parsedDate.substr(0,4));
    const month = Number(parsedDate.substr(5,2));
    const day   = Number(parsedDate.substr(8,2));
    
    ajax({
      url:`api/getVials/${year}/${month}/${day}`,
      type:"get"
    }).then((response) => {
      console.log(response);
      const newVialMap = new Map();
      if (response[JSON_VIALS]) for (const vialString of response[JSON_VIALS]) {
        const vial = ParseJSONstr(vialString);
        newVialMap.set(vial.ID, vial);
      }
      this.setState({...this.state, vials : newVialMap});
    })

  }

  /**
   * This function updates a value of the state determined by the key to the newVale. 
   * 
   * @param {string} key 
   * @param {*} newValue 
   */
  changeState(key,newValue){
    const newState = {...this.state};
    newState[key] = newValue;
    this.setState(newState);
  }

  changeSearchDate(event){
    const newState = {...this.state};
    newState.filterSearchDate = autoAddCharacter(event, "/", new Set([2,5]), newState.filterSearchDate); 
    this.setState(newState);
  }

  /**
   * This function 
   * @param {string} NewSelect 
   * @returns {void}
   */
  changeSelectState(NewSelect){
    const newState = {...this.state};
    
    if (NewSelect === "null") {
      newState.filterCustomer = "";
    } else {
      newState.filterCustomer = Number(NewSelect);
    }
    this.setState(newState)
  }

  changeSearch(newSearchPattern){
    const newState = {...this.state}
    if (this.state.SearchPattern == newSearchPattern) {
      newState.InvertedSearch = !newState.InvertedSearch;
    } else {
      newState.SearchPattern = newSearchPattern;
    }
    this.setState(newState);
  }

  renderVial(vial){
    // Sadly I need some extra functionality so can't really use the table rendering function :(
    
    const customer = this.state.customers.get(Number(vial.customer));
    const orderMap = (vial.OrderMap) ? vial.OrderMap : "-";

    return (
      <tr key={vial.ID}>
        <td onClick={() => {this.changeSearch(SearchOptions.ID)}}>      {vial.ID}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.CHARGE)}}>  {vial.charge}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.DATE)}}>    {parseDateToDanishDate(vial.filldate)}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.TIME)}}>    {vial.filltime}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.VOLUME)}}>  {vial.volume}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.ACTIVITY)}}>{vial.activity}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.OWNER)}}>   {customer.UserName}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.ORDER)}}>   {vial.OrderMap}</td>
      </tr>
    );
  }
  
  render(){
    const SortedVials = [...this.state.vials.values()].sort((vial1, vial2) => {
      const invertedSearchFactor = (this.state.InvertedSearch) ? -1 : 1;
      switch (this.state.SearchPattern) {
        case SearchOptions.ID:
          return invertedSearchFactor*(vial1.ID - vial2.ID);
        case SearchOptions.CHARGE:
          return invertedSearchFactor*((vial1.charge > vial2.charge) - (vial1.charge < vial2.charge));
        case SearchOptions.DATE:
          const date1 = new Date(vial1.filldate).valueOf();
          const date2 = new Date(vial2.filldate).valueOf();
          return (
            isFinite(date1) && isFinite(date2) ?
            invertedSearchFactor*((date1>date2) - (date1<date2)) :
            NaN
        );
        case SearchOptions.TIME:
          return invertedSearchFactor*((vial1.filltime > vial2.filltime) - (vial1.filltime < vial2.filltime));
        case SearchOptions.VOLUME:
          return invertedSearchFactor*(vial1.volume - vial2.volume);
        case SearchOptions.ACTIVITY:
          return invertedSearchFactor*(vial1.activity - vial2.activity);
        case SearchOptions.OWNER:
          return invertedSearchFactor*(vial1.customer - vial2.customer);
        case SearchOptions.ORDER:
          return invertedSearchFactor*(vial1.OrderMap - vial2.OrderMap)
        default:
          throw "Unknown Searchpattern:" + this.state.SearchPattern
      }
    });

    const RenderedVials = [];
    const filter_batch = new RegExp(this.state.filterBatch, 'g');
    for (const vial of SortedVials){
      if (this.state.filterCustomer) {
        if (filter_batch.test(vial.charge) && this.state.filterCustomer == vial.customer) RenderedVials.push(this.renderVial(vial));
      } else {
        if (filter_batch.test(vial.charge)) RenderedVials.push(this.renderVial(vial));
      }
    }

    const CustomerOptions = []
    for(const [_, customer] of this.state.customers){
      CustomerOptions.push(
        <option value={customer.CustomerNumber} key={customer.CustomerNumber}>{customer.UserName}</option>
      )
    }

    return(
    <Container>

      <Row>
        <Col>
          <input value={this.state.filterBatch} onChange={(event) => {this.changeState("filterBatch", event.target.value)}} placeholder="batch nummer"/> 
        </Col>
        <Col>
          <select onChange={(event) => {this.changeSelectState(event.target.value)}}>
            <option value="null" >-----</option>
            {CustomerOptions}
          </select> 
        </Col>
        <Col>
          <input value={this.state.filterSearchDate} onChange={(event) => this.changeSearchDate(event)} placeholder="Dato"/> 
        </Col>
        <Col>
          <Button onClick={this.dateSearch.bind(this)}>Søg</Button>
        </Col>
      </Row>
      <Table>
        <thead>
          <tr>
            <th onClick={() => {this.changeSearch(SearchOptions.ID)}}>ID</th>
            <th onClick={() => {this.changeSearch(SearchOptions.CHARGE)}}>Batch nummer</th>
            <th onClick={() => {this.changeSearch(SearchOptions.DATE)}}>Dato</th>
            <th onClick={() => {this.changeSearch(SearchOptions.TIME)}}>Tappe tidspunkt</th>
            <th onClick={() => {this.changeSearch(SearchOptions.VOLUME)}}>Volume</th>
            <th onClick={() => {this.changeSearch(SearchOptions.ACTIVITY)}}>Aktivitet</th>
            <th onClick={() => {this.changeSearch(SearchOptions.OWNER)}}>Ejer</th>
            <th onClick={() => {this.changeSearch(SearchOptions.ORDER)}}>Ordre</th>
          </tr>
        </thead>
        <tbody>
          {RenderedVials}
        </tbody>
      </Table>
    </Container>);
  }
}
