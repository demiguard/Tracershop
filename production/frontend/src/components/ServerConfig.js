import { ajax } from "jquery";
import React, { Component } from "react";
import { Container, Row } from "react-bootstrap";
import { JSON_ACTIVE_DATABASE, JSON_DATABASE, JSON_FIELD_TO_UPDATE } from "./lib/constants";

export { ServerConfigPage }

export default class ServerConfigPage extends Component {
  constructor(props){
    super(props)
    this.state = {
      activeDatabase : undefined,
      databases : [],

    }
    ajax({
      url:"api/ServerConfig",
      type:"get"
    }).then((data) => {
      const activeDatabase = data[JSON_ACTIVE_DATABASE];
      const databases = data[JSON_DATABASE];

      this.setState({...this.state, activeDatabase : activeDatabase, databases : databases});
    });
  }

  /** This function updates the active database
   * 
   * @param {*} event 
   */
  updateActiveDatabase(event){
    const SendObject = {}; 
    SendObject[JSON_FIELD_TO_UPDATE] = JSON_ACTIVE_DATABASE
    SendObject[JSON_DATABASE] = event.target.value


    ajax({
      url:"api/ServerConfig",
      type:"PUT",
      dataType:"JSON",
      data:JSON.stringify(SendObject)
    }).then(() => {
      this.setState({
        
        activeDatabase : event.target.value
      })
    })

  }


  /** This function renders all the database options
   * 
   * @returns {List[JSX.Element]}
   */
  renderOptions(){
    const options = [];
    for (const database of this.state.databases) {
      console.log(database);
      options.push((<option key={database} value={database}>{database}</option>))
    }

    return options;
  }

  render() {
    const options = this.renderOptions();

    return(<Container>
        <Row>
          <label>Database:</label>
          <select value={this.state.activeDatabase} onChange={()=>this.updateActiveDatabase(event)}>
            {options}
          </select>
        </Row>
    </Container>);
  }
}