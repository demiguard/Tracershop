import React, { Component } from "react";
import { Container } from "react-bootstrap";
import { Calender } from "../injectables/calender";

export { ShopOrderPage }

class ShopOrderPage extends Component {
  constructor(props){
    super(props);

  }

  render(){
    return (
    <Container>
      <Row>
        <Col>
        
        </Col>
        <Col>
          <div className="CustomerSelectArea"></div>
          <Calender
            
          ></Calender>
        </Col>
      </Row>
    </Container>);
  }

}