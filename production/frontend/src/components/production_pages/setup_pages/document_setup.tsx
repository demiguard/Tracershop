import { object } from "prop-types";
import React, { useState } from "react";
import { Card, Col, Container, FormControl, Row } from "react-bootstrap";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { IdempotentIcon } from "~/components/injectable/icons";
import { Image } from "~/components/injectable/image";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { TracershopState, Vial, VialTemplate } from "~/dataclasses/dataclasses";
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

  const template = new VialTemplate(-1, documentTitle, 0, null);


  function validateDocument() {
    const headerTitle= "title"
    const m = new ErrorMonad();

    m.bind(parseTextBind(documentTitle, headerTitle, 3, 128));

    if(m.registerErrors({
      [headerTitle] : (error) => setDocumentError(error)
    })){
      return false;
    }

    return [true, new VialTemplate(-1, m.get_value(headerTitle), 0, null)]
  }

  function creationCallback(returnMessage){
    if(returnMessage.messageType === "error"){
      setDocumentError(returnMessage.error);
    }
  }

  return (
    <Card>
      <Card.Header>
        <Row>
          <Col xs={11}>
            <TracershopInputGroup error={documentError} label="Dokument title">
              <FormControl value={documentTitle} onChange={setStateToEvent({stateFunction : setDocumentTitle})}/>
            </TracershopInputGroup>
            </Col>
          <Col xs={1} style={{justifyContent : "flex-end", display : "flex"}}>
          <CommitIcon
            width = {32}
            height = {32}
            temp_object={template}
            object_type={DATA_VIAL_TEMPLATE}
            validate={validateDocument}
            callback={creationCallback}
          />
          </Col>
        </Row>
      </Card.Header>
    </Card>
  );
}

function DocumentCard({ document, selectedDocumentState }){
  const [selectedDocumentID, setSelectedDocument] = selectedDocumentState;

  const isSelected = document.id === selectedDocumentID;
  const displayTitle = isSelected ? <u>{document.title}</u> : <div>{document.title}</div>

  function selectThisDocument(){
    setSelectedDocument(document.id)
  }

  return (
    <Card onClick={selectThisDocument}>
      <Card.Header>
        {displayTitle}
      </Card.Header>
    </Card>)
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