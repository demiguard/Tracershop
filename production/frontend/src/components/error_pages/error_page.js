import React, { } from "react";
import { Container } from "react-bootstrap";
// import styles from "/src/css/Errors.module.css"
import { db } from "~/lib/local_storage_driver";
import { useWebsocket } from "~/components/tracer_shop_context"
import { WEBSOCKET_MESSAGE_ERROR, WEBSOCKET_MESSAGE_LOG_ERROR, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";

const styles = {
  ErrorContainer : {
    borderStyle: 'solid',
    borderColor: 'black',
    borderLeft: '2px',
    borderRight: '2px',
    borderTop: '0',
    borderBottom: '0',
    minHeight: '100vh',
    boxShadow: '3px 3px 6px 6px #888888',
  }
}



export function ErrorPage (props) {
  console.log(props)
  let errorMessage = ""
  let lines = []

  const websocket = useWebsocket()

  // error is done, reset the state such that
  for(const database_table of Object.keys(db.types)){
    db.delete(database_table);
  }


  if (props.error !== undefined){
    const backend_error = {
      columnNumber : null,
      fileName : null,
      lineLumber : null,
      message : null,
      stack : null,
    }

    if(props.error.columnNumber){
      backend_error.columnNumber = props.error.columnNumber;
    }
    if(props.error.fileName){
      backend_error.fileName = props.error.fileName;
    }
    if(props.error.lineLumber){
      backend_error.lineLumber = props.error.lineLumber;
    }
    if(props.error.message){
      backend_error.message = props.error.message;
    }
    if(props.error.stack){
      backend_error.stack = props.error.stack;
    }

    errorMessage = props.error.message;

    if (props.error.stack !== undefined && props.error.message !== undefined){
      const /**@type {String} */ stack = props.error.stack
      //console.log(stack)
      lines = stack.split('\n').filter(
        (line) => line.includes('tracershop_frontend/./src/')
        ).map((line, i) => <p key={i}>{line}</p>);
    }
    if (websocket) {
      websocket.send({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_LOG_ERROR,
        [WEBSOCKET_MESSAGE_ERROR] : backend_error
      });
    }
  } else {
    console.log("OOH NOES, THE ERROR HANDLER HAD AN ERROR");
  }

  return(<Container
    className={styles.ErrorContainer}
  >
    <h1>Ukendt fejl</h1>
    <p>Der er sket en unkendt fejl, som ikke kunne håndteres.</p>
    <p>Der er send en besked til de ansvarlige for tracershop, som vil rette fejlen hurtigst muligt</p>
    <h1>Teknisk infomation</h1>
    <p>Error: {errorMessage}</p>
    <hr></hr>
    {lines}
  </Container>);
}
