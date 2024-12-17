import React, { useState } from "react";
import { FormControl, Table } from "react-bootstrap";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { setStateToEvent, setTempMapToEvent, setTempObjectToEvent } from "../../../lib/state_management";
import { Select, toOptions } from "../../injectable/select";
import { DATA_LOCATION } from "~/lib/shared_constants"
import { nullParser } from "~/lib/formatting";
import { EndpointSelect } from "../../injectable/derived_injectables/endpoint_select";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { CommitButton } from "~/components/injectable/commit_button";
import { compareLoosely } from "~/lib/utils";
import { Optional } from "~/components/injectable/optional";

const FILTER_TYPES = {
  LOCATION_CODE : 1,
  COMMON_NAME : 2,
}


export function LocationTable(){
  const state = useTracershopState()
  const [filter, setFilter] = useState("");
  const [filterType, setFilterType] = useState(FILTER_TYPES.LOCATION_CODE);
  const [tempLocations, setTempLocations] = useState(state.location);

  const filterOptions = toOptions([{
    id : FILTER_TYPES.LOCATION_CODE,
    name: "Rum Kode"
  }, {
    id : FILTER_TYPES.COMMON_NAME,
    name : "Kalde Navn"
  }]);

  function validate(location_id){
    const tempLocation = tempLocations.get(location_id);
    return () => {
      if(tempLocation.common_name > 120){
        return [false, {}];
      }
      const newCommonName = tempLocation.common_name ? tempLocation.common_name : null;
      const newEndpoint = tempLocation.endpoint ? Number(tempLocation.endpoint) : null;

      return [true, {...tempLocation, common_name : newCommonName, endpoint : newEndpoint}];
    }
  }

  const locations = [...tempLocations.values()].filter((location) => {
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
    (location) => {
      const changed = !compareLoosely(state.location.get(location.id), location);
      return (
        <tr key={location.id}>
          <td style={{
            verticalAlign : "middle",
            textAlign : "center"
          }}>{location.location_code}</td>
          <td style={{
            verticalAlign : "middle",
            textAlign : "center"
          }}>
            <TracershopInputGroup>
              <FormControl
                aria-label={`location-common-name-${location.id}`}
                maxLength={120}
                value={nullParser(location.common_name)}
                onChange={setTempMapToEvent(setTempLocations, location.id, 'common_name')}
              />
            </TracershopInputGroup>
          </td>
          <td style={{
            verticalAlign : "middle",
            textAlign : "center"
          }}>
            <EndpointSelect
              aria-label={`location-delivery-endpoint-${location}`}
              customer={state.customer}
              delivery_endpoint={state.delivery_endpoint}
              emptyEndpoint
              value={nullParser(location.endpoint)}
              onChange={setTempMapToEvent(setTempLocations, location.id, 'endpoint')}
            />
          </td>
          <td style={{
            verticalAlign : "middle",
            textAlign : "center"
          }}>
            <Optional exists={changed}>
              <CommitButton
                temp_object={location}
                object_type={DATA_LOCATION}
                validate={validate(location.id)}
              />
            </Optional>
          </td>
        </tr>)
  });

  // I really wanna state how much I fucking hate react RN.
  // So there's a functional difference to making a new component with
  // everything neat and clearly separated, and this mess.
  // When you have multi components you either lose focus when typing or
  // have your state reset, when the original state changes.
  // This is fucking stupid because you're forced to write ugly code.

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