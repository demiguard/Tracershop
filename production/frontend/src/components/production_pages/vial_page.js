import { ajax } from "jquery";
import React, {Component,} from "react";
import { Container, Table, Row, Col, Button, FormControl, Form } from "react-bootstrap";
import { JSON_CUSTOMER, JSON_VIAL, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_SUCCESS } from "../../lib/constants";
import { parseDate, parseDateToDanishDate, ParseJSONstr } from "../../lib/formatting";
import { addCharacter } from "../../lib/utils";
import { changeState } from "../../lib/state_management";
import propTypes from 'prop-types'
import { Vial } from "../../dataclasses/dataclasses";



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
  static propTypes = {
    customers : propTypes.objectOf(Map),
    vials : propTypes.objectOf(Map)
  }
  constructor(props){
    super(props)
    this.state = {
      filterCustomer   : "",
      filterBatch      : "",
      filterSearchDate : "",

      SearchPattern  : SearchOptions.DATE,
      InvertedSearch : true,

      vials : new Map(this.props[JSON_VIAL]), // The duplication here is to allow the user to search for some day
    }
  }

  keyDateSearch(event){
    if (event.key === "Enter"){
      this.dateSearch();
    }
  }

  /**
   * This function handles search button, being pressed
   * Functionality is sending a request to the backend and updating Vials on response.
   */
  dateSearch(){
    if(!this.state.filterSearchDate){
      this.setState({...this.state, vials : new Map(this.props.vials)});
      return;
    }
    console.log("This function needs fixing!")

    var parsedDate;
    try {
      parsedDate = parseDate(this.state.filterSearchDate);
    } catch {
      //TODO Error handling
      console.log("caught Error");
      return;
    }
    /*
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_GET_DATA_CLASS)
    message[WEBSOCKET_DATATYPE] = [JSON_VIAL]
    message[WEBSOCKET_FILTER] = {
      filterType : "Equality",
      filter : {
        filldate : parsedDate
      }
    }
    this.props.websocket.send(message).then((response) => {
      if(response[WEBSOCKET_MESSAGE_SUCCESS] == WEBSOCKET_MESSAGE_SUCCESS){
        const vials = new Map();
        for(const vialStr of data[JSON_VIAL]){
          const vial = ParseJSONstr(vialStr);
          vials.set(vial.ID, vial)
        }

        this.setState({...this.state,
          vial : vials
        })
      } else {

      }
    })
    */
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

  /**
   * Renders a row representing the vial in the table
   * @param {Vial} vial - The Vial to be rendered
   * @returns {JSX} tr with the table row
   */
  renderVial(vial){
    // Sadly I need some extra functionality so can't really use the table rendering function :(
    var customerName = "";
    for(const [_, customer] of this.props[JSON_CUSTOMER]){
      if (customer.kundenr == vial.customer){
        customerName = customer.UserName;
        break;
      }
    }
    if(!customerName) customerName = `Ukendet med nummer ${vial.customer}`;
    //const customerName = (customer) ? customer.UserName : `Ukendet med nummer ${vial.customer}`;

    return (
      <tr key={vial.id}>
        <td onClick={() => {this.changeSearch(SearchOptions.ID)}}>      {vial.id}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.CHARGE)}}>  {vial.lot_number}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.DATE)}}>    {parseDateToDanishDate(vial.fill_date)}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.TIME)}}>    {vial.fill_time}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.VOLUME)}}>  {vial.volume}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.ACTIVITY)}}>{vial.activity}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.OWNER)}}>   {customerName}</td>
        <td onClick={() => {this.changeSearch(SearchOptions.ORDER)}}>   {vial.assigned_to}</td>
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
          return invertedSearchFactor*(vial1.order_map - vial2.order_map)
        default:
          throw "Unknown Searchpattern:" + this.state.SearchPattern
      }
    });

    const RenderedVials = [];
    const filter_batch = new RegExp(this.state.filterBatch, 'g');
    for (const vial of SortedVials){
      if (this.state.filterCustomer) {
        if (filter_batch.test(vial.charge) &&
              this.state.filterCustomer == vial.customer)
                RenderedVials.push(this.renderVial(vial));
      } else {
        if (filter_batch.test(vial.charge))
          RenderedVials.push(this.renderVial(vial));
      }
    }

    const CustomerOptions = [<option key="-1" value="null" >-----</option>]
    for(const [_, customer] of this.props[JSON_CUSTOMER]){
      CustomerOptions.push(
        <option value={customer.kundenr} key={customer.kundenr}
          >{customer.UserName}</option>
      )
    }

    return(
    <Container>

      <Row>
        <Col>
          <FormControl
            value={this.state.filterBatch}
            onChange={changeState("filterBatch", this).bind(this)}
            placeholder="batch nummer"
          />
        </Col>
        <Col>
          <Form.Select onChange={(event) => {this.changeSelectState(event.target.value)}}>
            {CustomerOptions}
          </Form.Select>
        </Col>
        <Col>
          <FormControl
            onKeyDown={addCharacter('/', "filterSearchDate", [2,5], this).bind(this)}
            value={this.state.filterSearchDate} onChange={changeState("filterSearchDate", this).bind(this)}
            placeholder="Dato"
          />
        </Col>
        <Col>
          <Button  onClick={this.dateSearch.bind(this)}>Søg</Button>
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
