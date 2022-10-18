import React, { Component } from "react";
import { Container } from "react-bootstrap";

import styles from "/src/css/Errors.module.css"

export { InvalidVersionPage }

export default class InvalidVersionPage extends Component {
  constructor(props){
    super(props);
  }

  render() {

    return(<Container
      className={styles.ErrorContainer}
    >
      <h1>Forkert Version af tracershop</h1>
      <p>Serveren kører en nyere version af tracershop end chrome</p>
      <p>Tryk 'Ctrl + Shift + R' for at få den nye version</p>
      <p>Det betyder at der nok nye funktionaliter </p>

    </Container>);
  }
}