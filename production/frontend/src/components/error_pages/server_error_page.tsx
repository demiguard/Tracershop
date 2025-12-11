import React from "react";
import { Container } from "react-bootstrap";
import { InvalidVersionPage } from "~/components/error_pages/invalid_version_page";
import { ERROR_CONTAINER_CSS } from "~/lib/styles";
import { ERROR_INVALID_JAVASCRIPT_VERSION, MessageValidationResult } from "~/lib/shared_constants";
import { TracershopNavbar } from "../injectable/navbar";

export function ServerErrorPage({error}){
  if(error.error_type === MessageValidationResult.JavascriptVersionMismatch){
    return <InvalidVersionPage/>
  }

  return (
    <div>
      <TracershopNavbar
        setActivePage={() => {}}
        ActiveKey={"empty"}
        Names={[]}
        NavbarElements={[]}
        logout={() => {}}
        isAuthenticated={false}
      >
      </TracershopNavbar>

    <Container style={ERROR_CONTAINER_CSS}>
      <h1>Serveren oplevede en ukendt fejl.</h1>
      <p>Hvad end du prøvede, så blev det ikke gennemført</p>
      <p>Du bedes sende en mail til cjen0668@regionh.dk med en beskrivelse med hvad du prøvede at gøre.</p>
    </Container>
    </div>
  );
}