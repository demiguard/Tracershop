import { object } from "prop-types";
import React, { useState } from "react";
import { Card, Col, Container, FormControl, Row } from "react-bootstrap";
import { IdempotentIcon } from "~/components/injectable/icons";
import { Image } from "~/components/injectable/image";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { TracershopState, VialTemplate } from "~/dataclasses/dataclasses";
import { ErrorMonad, RecoverableError, useErrorState } from "~/lib/error_handling";
import { parseTextBind } from "~/lib/parsing";
import { DATA_VIAL_TEMPLATE } from "~/lib/shared_constants";
import { setStateToEvent } from "~/lib/state_management";


const TEMPLATE_RENDER_MAPPING = {
  '$dato$' : (state: TracershopState) => {},
  '$kunde-navn$' : (state: TracershopState) => {},
  '$kunde-adresse$' : (state: TracershopState) => {},
  '$kunde-by$' : (state: TracershopState) => {},
  '$kunde-post-nummer$' : (state: TracershopState) => {},
  '$kunde-email$' : (state: TracershopState) => {},
  '$tracer-navn$' : (state: TracershopState) => {},
  '$tracer-klinisk-navn$' : (state: TracershopState) => {},
  '$hætteglas-aktivitet$' : (state: TracershopState) => {},
  '$hætteglas-batch$' : (state: TracershopState) => {},
  '$hætteglas-tid$' : (state: TracershopState) => {},
  '$hætteglas-dato$' : (state: TracershopState) => {},
  '$hætteglas-volume$' : (state: TracershopState) => {},
}

function NewDocumentCard(){
  const [documentTitle, setDocumentTitle] = useState("Nyt dokument");
  const [documentError, setDocumentError] = useErrorState()

  const websocket = useWebsocket();

  function createDocument() {
    const m = new ErrorMonad();

    m.bind(parseTextBind(documentTitle, "Dokument", 3, 128));

    if(m.registerErrors({
      Dokument : (error) => setDocumentError(error)
    })){
      return;
    }

    const template = new VialTemplate(-1, m.get_value("Dokument"), 0, null);

    return websocket.sendCreateModel(DATA_VIAL_TEMPLATE, template)
  }

  return (
    <Card>
      <Card.Header>
        <Row>
          <Col xs={11}>
            <TracershopInputGroup error={documentError}>
              <FormControl value={documentTitle} onChange={setStateToEvent(setDocumentTitle)}/>
            </TracershopInputGroup>
            </Col>
          <Col xs={1} style={{justifyContent : "flex-end", display : "flex"}}>
          <IdempotentIcon
            beforeInjection={(svg) => {
              svg.style.fill = "green"
            }}
            height={32}
            width={32}
            onClick={createDocument}
            src="/static/images/plus2.svg">
          </IdempotentIcon>
          </Col>
        </Row>
      </Card.Header>
    </Card>
  );
}

function DocumentCard({ document, selectedDocumentState }){
  const [selectedDocumentID, setSelectedDocument] = selectedDocumentState;

  const isSelected = document.id === selectedDocumentID;

  function selectThisDocument(){
    setSelectedDocument(document.id)
  }

  return <Card onClick={selectThisDocument}> I'm a document </Card>
}

function DocumentList({ selectedDocument : selectedDocumentState }){
  const state = useTracershopState();
  const documentsCards = [...state.vial_template.values()].map(
    (doc) => (
      <DocumentCard selectedDocumentState={selectedDocumentState} key={doc.id} document={doc}/>
    )
  );

  return (
    <Container>
      <NewDocumentCard/>
      {documentsCards}
    </Container>
  );
}

function HelperBlock(){
  const keys = [...Object.keys(TEMPLATE_RENDER_MAPPING)].map((key,i) => <li key={i}>{key}</li>)

  return <div>
    <h2> I dokumentet kan du referer til føglende dynamiske værdier:</h2>
    <ul>
      {keys}
    </ul>
  </div>
}

function DocumentEditor(){
  return <div></div>
}

export function DocumentSetup(){
  const state = useTracershopState();
  const [showHelperBlock, setShowHelperBlock] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<number>(null);



  return (
    <Container>
      <DocumentList selectedDocument={[selectedDocument, setSelectedDocument]}/>
      <Optional exists = {showHelperBlock}>

        <HelperBlock/>
      </Optional>
      <Optional exists={selectedDocument != null}>
        <DocumentEditor/>
      </Optional>
      Hello World?
    </Container>
  );
}