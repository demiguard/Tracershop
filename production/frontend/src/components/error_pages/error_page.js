import React, { } from "react";
import { Container, Row } from "react-bootstrap";
import styles from "/src/css/Errors.module.css"



export function  ErrorPage (props) {
  console.log(props)
  let errorMessage = ""
  let errorStack = []
  let lines = []

  if (props.error !== undefined
    && props.error.stack !== undefined
    && props.error.message !== undefined
    ){
    errorMessage = props.error.message;

    const /**@type {String} */ stack = props.error.stack
    //console.log(stack)
    lines = stack.split('\n').filter(
      (line) => line.includes('tracershop_frontend/./src/')
    ).map((line, i) => <p key={i}>{line}</p>);
  } else {
    console.log("OOH NOES, THE ERROR HANDLER HAD AN ERROR");
  }

  return(<Container
    className={styles.ErrorContainer}
  >
    <h1>Ukendt fejl</h1>
    <p>Der er sket en unkendt fejl og derfor er den uhåndteret.</p>
    <p>Kontakt den ansvarlige for Tracershop, og beskriv hvordan hvad du lavede før du fik denne fejl.</p>
    <p>Den ansvarlige person kan kontaktes på {"@AdminTelefon"} eller {"@AdminMail"}</p>
    <h1>Teknisk infomation</h1>
    <p>Error: {errorMessage}</p>
    <hr></hr>
    {lines}
  </Container>);
}
