import { ajax } from "jquery";
import React, {Component,} from "react";
import { Table } from "react-bootstrap";
import { renderTableRow } from "./lib/Rendering";

export {VialPage}


export default class VialPage extends Component {
  constructor(props){
    super(props)
    this.state = {
      vials : new Map(),
      customers : new Map()
    }
    ajax({
      url:"api/getVialInfo",
      type:"get"
    }).then((data) => {

    })
  }


  renderVial(vialID, Vial){
    console.log("I'm a genious");
    return renderTableRow(vialID,[])
  }
  
  render(){
    const renderedVials = Array.from(this.state.vials).map(renderVial);


    return(
    <div>
      <Table>
        <thead>
          <tr>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {}
        </tbody>
      </Table>
    </div>);
  }
}