import React, { Component } from "react";
import { Container, Table, FormControl } from "react-bootstrap";
import { ajax } from "jquery";

export {ConfigPage}

export default class ConfigPage extends Component {
  constructor(props){
    super(props)

    this.state = {
      names : [],
      isotope : [],
      isotopeOptions : {},
      injections : [],
      lockOrder : [],
      tracerIDs : []
    }
    this.fetchTracers()
  }

  fetchTracers() {
    ajax({
      url:"api/gettracers"
    }).then((res) => {
      const TracerInfo = res["tracer"];
      this.setState({
        ...this.state,
        names : TracerInfo["name"],
        isotope : TracerInfo["isotope"],
        isotopeOptions : res["isotope"],
        injections : TracerInfo["inj"],
        lockOrder : TracerInfo["block"],
        tracerIDs : TracerInfo["TID"]
      });
    });
  }

  renderIsotopeSelect() {
    const options = [];
    for (const [IsotopeID, isotope] of Object.entries(this.state.isotopeOptions)) {
      options.push((<option key={IsotopeID} value={IsotopeID}>{isotope}</option>))
    }

    return (
      <select>
        {options}
      </select>
    ) 
  }

  renderTracer(i) {
    return(
    <tr key={this.state.tracerIDs[i]}>
      <td>
        <FormControl defaultValue={this.state.names[i]}/>
      </td>
      <td>
        {this.renderIsotopeSelect(this.state.isotope[i])}
      </td>
      <td>
        <FormControl defaultValue={this.state.injections[i]}/>
      </td>
      <td>
        <FormControl defaultValue={this.state.lockOrder[i]}/>
      </td>
      <td>
        config Button
      </td>
    </tr>
    );
  }

  render() {  
    const Tracers = []
    for (let i=0; i < this.state.tracerIDs.length; i++ ) {
      Tracers.push(this.renderTracer(i));
    }

    return (
    <Container>
      <Table>
        <thead>
          <tr>
            <th>Tracer</th>
            <th>Isotope</th>
            <th>Injektioner</th>
            <th>Lås bestilling</th>
            <th>Konfiguration</th>
          </tr>
        </thead>
        <tbody>
          {Tracers}
        </tbody>
      </Table>
    </Container>);
  }
}