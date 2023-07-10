import React, { useState } from "react";
import { FormControl, InputGroup, Table } from "react-bootstrap";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { setEvent } from "../../../lib/state_management";
import { Select } from "../../injectable/select";
import { JSON_ENDPOINT, JSON_LOCATION, PROP_WEBSOCKET } from "../../../lib/constants";
import { Location } from "../../../dataclasses/dataclasses";
import { nullParser } from "../../../lib/formatting";
import { TracerWebSocket } from "../../../lib/tracer_websocket";


/**
 * Row in the table
 * @param {{
 * location : Location
 * websocket : TracerWebSocket
 * }} props
 * @returns {Element}
 */
function LocationTableRow({location, websocket}){
  const nulledCommonName = nullParser(location.common_name)
  const [commonName, setCommonName] = useState(nulledCommonName)

  function updateCommonName(event){
    setCommonName(event.target.value)

    const newLocation = {...location}
    newLocation.common_name = event.target.value

    if(newLocation.common_name.length <= 120){
      websocket.sendEditModel(JSON_LOCATION, [newLocation])
    }
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
      <Select></Select>
    </td>
  </tr>)
}

export function LocationTable(props){
  const [filter, setFilter] = useState("")
  const [filterType, setFilterType] = useState(1)

  const filterOptions = [{
    id : 1,
    name: "Rum Kode"
  }, {
    id : 2,
    name : "Kalde Navn"
  }]

  const endpointOptions = [...props[JSON_ENDPOINT].values()].map((endpoint) =>{
    return {
      id : endpoint.id,
      name : endpoint.name
    }
  })


  const locations = [...props[JSON_LOCATION].values()].map(
    (location, i) => {
      return (<LocationTableRow
                key={i}
                location={location}
                websocket={props[PROP_WEBSOCKET]}
                endpointOptions={endpointOptions}
              />)
  })

  return (
    <div>
      <TracershopInputGroup label="Filter">
        <Select
          options={filterOptions}
          value={filterType}
          nameKey="name"
          valueKey="id"
          onChange={setEvent(setFilterType)}
        />
        <FormControl value={filter} onChange={setEvent(setFilter)}/>
      </TracershopInputGroup>

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