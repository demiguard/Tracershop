import React, { Component } from "react";
import { Container } from "react-bootstrap";

import "/src/css/ErrorPage.css"

export { ErrorPage }

export default class ErrorPage extends Component {
  constructor(props){
    super(props);


  }


  render() {
    const StackTraceFull = this.props.SiteErrorInfo.componentStack;
    const StackTracePaths = StackTraceFull.split("\n");

    const files = StackTracePaths.filter((string) => {return (string.includes("@") && !string.includes("node_modules"));})
    console.log(files)

    const fileRows = []
    for(const fullfilepath of files){
      const fileParts = fullfilepath.split("Tracershop-frontend/.");
      const fileLineCharacter = fileParts[1];
      const fileLineCharacterParts = fileLineCharacter.split("?");
      const file = fileLineCharacterParts[0];
      const LineCharacterParts = fileLineCharacterParts[1].split(':')
      const Line = LineCharacterParts[1];

      fileRows.push([(<p key={fileRows.length}>Filen: {file} Linje: {Line}</p>)])
    }



    return(<Container
      className="ErrorContainer"
    >
      <h1>Fejl</h1>
      <p>Der er sket en unkendt og derfor uhåndteret fejl.</p>
      <p>Kontakt den ansvarlige for Tracershop.</p>
      <h1>Teknisk infomation</h1>
      <p>Error: {this.props.SiteError}</p>
      <hr></hr>
      <h3>StackTrace:</h3>
      {fileRows}
    </Container>);
  }
}