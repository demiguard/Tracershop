import React, { } from "react";
import { Container } from "react-bootstrap";
import styles from "/src/css/Errors.module.css"



export function  ErrorPage (props) {
  console.log(props)
  let errorMessage = ""
  let errorStack = []

  if (props.error !== undefined
    && props.error.stack !== undefined
    && props.error.message !== undefined
    ){
    errorMessage = props.error.message

    const stack = props.error.stack
    console.log(stack)

  } else {

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

  </Container>);
}
