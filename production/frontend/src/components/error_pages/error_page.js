import React, { Component } from "react";
import { Container } from "react-bootstrap";
import styles from "/src/css/Errors.module.css"

export { ErrorPage }

export default class ErrorPage extends Component {
  constructor(props){
    super(props);
  }

  render() {
    const StackTraceFull = this.props.SiteErrorInfo.componentStack;
    const StackTracePaths = StackTraceFull != undefined ? StackTraceFull.split("\n") : [];

    const StackTraceEmpty = StackTracePaths == [] ? "Stack trace is empty" : "";

    const files = StackTracePaths.filter((string) => {return (string.includes("@") && !string.includes("node_modules"));})

    const fileRows = []
    for(const fullfilepath of files){
      const fileParts = fullfilepath.split("tracershop_frontend/.");
      const fileLineCharacter = fileParts[1];
      const fileLineCharacterParts = fileLineCharacter.split("?");
      const file = fileLineCharacterParts[0];
      const LineCharacterParts = fileLineCharacterParts[1].split(':')
      const Line = LineCharacterParts[1];

      fileRows.push([(<p key={fileRows.length}>Filen: {file} Linje: {Line}</p>)])
    }

    return(<Container
      className={styles.ErrorContainer}
    >
      <h1>Ukendt fejl</h1>
      <p>Der er sket en unkendt fejl og derfor er den uhåndteret.</p>
      <p>Kontakt den ansvarlige for Tracershop, og beskriv hvordan hvad du lavede før du fik denne fejl.</p>
      <p>Den ansvarlige person kan kontaktes på {"@AdminTelefon"} eller {"@AdminMail"}</p>
      <h1>Teknisk infomation</h1>
      <p>Error: {String(this.props.SiteError)}</p>
      <hr></hr>
      {fileRows.length > 0 ?
      <div>
        <h3>StackTrace:</h3>
        {fileRows}
      </div> :
        StackTraceEmpty
      }
    </Container>);
  }
}