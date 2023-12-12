import React, { useState } from "react";
import { FormControl, InputGroup, Table } from "react-bootstrap";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { setStateToEvent, setTempObjectToEvent } from "../../../lib/state_management";
import { Option, Select, toOptions } from "../../injectable/select";
import { DATA_CUSTOMER, DATA_ENDPOINT, DATA_LOCATION } from "~/lib/shared_constants"
import { Location } from "~/dataclasses/dataclasses";
import { nullParser } from "~/lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { EndpointSelect } from "../../injectable/derived_injectables/endpoint_select";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { CommitButton } from "~/components/injectable/commit_button";

const FILTER_TYPES = {
  LOCATION_CODE : 1,
  COMMON_NAME : 2,
}

export function LocationTable(){
  const websocket = useWebsocket();
  const state = useTracershopState()
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState(FILTER_TYPES.LOCATION_CODE);

  const filterOptions = toOptions([{
    id : FILTER_TYPES.LOCATION_CODE,
    name: "Rum Kode"
  }, {
    id : FILTER_TYPES.COMMON_NAME,
    name : "Kalde Navn"
  }]);

  /**
  * Row in the table
  * @param {{
  * location : Location
  * }} props
  * @returns {Element}
  */
  function LocationTableRow({location}){
    const [tempLocation, setTempLocation] = useState(location);

    function validate(){
      if(tempLocation.common_name > 120){
        return false, {};
      }
      const newCommonName = tempLocation.common_name ? tempLocation.common_name : null;
      const newEndpoint = tempLocation.endpoint ? Number(tempLocation.endpoint) : null;

      return true, {...tempLocation, commonName : newCommonName, endpoint : newEndpoint};
    }

    return (
    <tr>
      <td>{location.location_code}</td>
      <td>
        <TracershopInputGroup>
          <FormControl
            aria-label={`location-common-name-${location.id}`}
            maxLength={120}
            value={tempLocation.common_name}
            onChange={setTempObjectToEvent(setTempLocation, 'common_name')}
          />
        </TracershopInputGroup>
      </td>
      <td>
        <EndpointSelect
          aria-label={`location-delivery-endpoint-${location.id}`}
          customer={state.customer}
          delivery_endpoint={state.delivery_endpoint}
          emptyEndpoint
          value={tempLocation.endpoint}
          onChange={setTempObjectToEvent(setTempLocation, 'endpoint')}
        />
      </td>
      <td>
        <CommitButton
          temp_object={tempLocation}
          object_type={DATA_LOCATION}
          validate={validate}
        />
      </td>
    </tr>)
  }


  const /**@type {Array<Location>} */ locations = [...state.location.values()].filter((location) => {
    if(filter === ""){
      return true
    }
    const regex = new RegExp(filter, 'i');
    if(filterType === FILTER_TYPES.LOCATION_CODE){
      return regex.test(location.location_code)

    } else if (filterType === FILTER_TYPES.COMMON_NAME) {
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
            aria-label="filter-type"
            options={filterOptions}
            value={filterType}
            onChange={setStateToEvent(setFilterType)}
            />
          <FormControl
            aria-label="filter"
            value={filter}
            onChange={setStateToEvent(setFilter)}
          />
        </TracershopInputGroup>
      </div>

      <Table>
        <thead>
        <tr>
          <th>Rum kode</th>
          <th>Kalde navn</th>
          <th>Destination</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
          {locations}
        </tbody>
      </Table>
    </div>)
}

LocationTable.FilterTypes = FILTER_TYPES