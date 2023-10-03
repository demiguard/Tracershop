import React, { useState } from "react";
import { FormControl, InputGroup, Table } from "react-bootstrap";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { setStateToEvent } from "../../../lib/state_management";
import { Option, Select, toOptions } from "../../injectable/select";
import { JSON_CUSTOMER, JSON_ENDPOINT, JSON_LOCATION, PROP_WEBSOCKET } from "../../../lib/constants";
import { Location } from "../../../dataclasses/dataclasses";
import { nullParser } from "../../../lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { EndpointSelect } from "../../injectable/derived_injectables/endpoint_select";




export function LocationTable(props){
  const [filter, setFilter] = useState("")
  const [filterType, setFilterType] = useState(1)

  const filterOptions = toOptions([{
    id : 1,
    name: "Rum Kode"
  }, {
    id : 2,
    name : "Kalde Navn"
  }]);

  /**
  * Row in the table
  * @param {{
  * location : Location
  * websocket : TracerWebSocket
  * }} props
  * @returns {Element}
  */
  function LocationTableRow({location, websocket}){
    const nulledCommonName = nullParser(location.common_name);
    const [commonName, setCommonName] = useState(nulledCommonName);
    const nulledLocation = nullParser(location.endpoint);
    const [endpoint, setEndpoint] = useState(nulledLocation);

    function updateCommonName(event){
      setCommonName(event.target.value)

      const newLocation = {...location}
      newLocation.common_name = event.target.value

      if(newLocation.common_name.length <= 120){
        websocket.sendEditModel(JSON_LOCATION, [newLocation])
      }
    }

    function updateEndpoint(event){
      setEndpoint(event.target.value);
      const newLocation = {...location};

      if (event.target.value === ""){
        newLocation.endpoint = null;
      } else {
        newLocation.endpoint = event.target.value;
      }

      websocket.sendEditModel(JSON_LOCATION, [newLocation]);
    }

    return (
    <tr>
      <td>{location.location_code}</td>
      <td>
        <InputGroup>
          <FormControl maxLength={120} value={commonName} onChange={updateCommonName}></FormControl>
        </InputGroup>
      </td>
      <td>
        <EndpointSelect
          customer={props[JSON_CUSTOMER]}
          deliveryEndpoint={props[JSON_ENDPOINT]}
          emptyEndpoint
          value={endpoint}
          onChange={updateEndpoint}
        />
      </td>
    </tr>)
  }


  const /**@type {Array<Location>} */ locations = [...props[JSON_LOCATION].values()].filter((location) => {
    if(filter === ""){
      return true
    }
    const regex = new RegExp(filter, 'i');
    if(filterType === 1){
      return regex.test(location.location_code)

    } else if (filterType === 2) {
      const regex = new RegExp(filter, 'i');
      return regex.test(location.common_name)
    }
    return false;
  }).sort((loc_1, loc_2) => {
    return loc_2.location_code < loc_1.location_code
  }).map(
    (location, i) => {
      return (<LocationTableRow
                key={i}
                location={location}
                websocket={props[PROP_WEBSOCKET]}
                endpointOptions={endpointOptions}
              />);
  });

  return (
    <div style={{
      marginTop : "15px",
      marginBottom : "15px",
    }}>
      <div>
        <TracershopInputGroup label="Filter">
          <Select
            options={filterOptions}
            value={filterType}

            onChange={setStateToEvent(setFilterType)}
            />
          <FormControl value={filter} onChange={setStateToEvent(setFilter)}/>
        </TracershopInputGroup>
      </div>

      <Table>
        <thead>
        <tr>
          <th>Rum kode</th>
          <th>Kalde navn</th>
          <th>Destination</th>
        </tr>
        </thead>
        <tbody>
          {locations}
        </tbody>
      </Table>
    </div>)
}