import React, { useEffect, useState } from "react";
import { Button, Card, Col, Container, FormControl, FormText, Row, Spinner } from "react-bootstrap";
import { IdempotentButton } from "~/components/injectable/buttons";
import { CommitIcon } from "~/components/injectable/commit_icon";

import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { TracershopState, VialTemplate } from "~/dataclasses/dataclasses";
import { ErrorMonad } from "~/lib/error_handling";
import { parseTextBind } from "~/lib/parsing";
import { DATA_VIAL_TEMPLATE, DATA_VIAL_TEMPLATE_TEXT, WEBSOCKET_MESSAGE_UPDATE_STATE } from "~/lib/shared_constants";
import { setStateToEvent, useTSFormState } from "~/lib/state_management";


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
  const {
    value : documentTitle,
    setValue : setDocumentTitle,
    error : documentError,
    setError : setDocumentError
  } = useTSFormState("Nyt Dokument");

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
              <FormControl value={documentTitle} onChange={setStateToEvent(
                { stateFunction : setDocumentTitle,
                  errorFunction : setDocumentError })}
              />
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
  const websocket = useWebsocket();

  const [selectedDocumentID, setSelectedDocument] = selectedDocumentState;

  const isSelected = document.id === selectedDocumentID;
  const displayTitle = isSelected ? <u>{document.title}</u> : <div>{document.title}</div>

  function selectThisDocument(){
    setSelectedDocument(document.id)
  }

  function decrementPrintCount(){
    if(document.print_count > 0){
      websocket.sendEditModels(DATA_VIAL_TEMPLATE, {
        ...document,
        print_count : document.print_count - 1
      });
    }
  }

  function incrementPrintCount(){
    // Here 10 is picked as a sanity check
    if(document.print_count < 10){
      websocket.sendEditModels(DATA_VIAL_TEMPLATE, {
        ...document,
        print_count : document.print_count + 1
      });
    }

  }

  return (
    <Card onClick={selectThisDocument}>
      <Card.Header>
        <Row style={{ width : "auto", justifyContent : "space-between", display : "flex" }}>
          <Col md="auto" style={{  alignItems : "center", display : "flex"}}>
            <Button>
              {displayTitle}
            </Button>
          </Col>
          <Col md="auto">
            <Row style={{display : "flex", flexWrap : "nowrap"}}>
              <Col style={{alignItems : "center", display : "flex", flex : "0 0 auto", width : "auto", whiteSpace: "nowrap"}}> Kopier printet </Col>
              <Col style={{ flex : "0 0 auto", width : "auto" }}>
                <TracershopInputGroup  label={<div onClick={decrementPrintCount}>-</div>} tail={<div onClick={incrementPrintCount}>+</div>}>
                  <FormControl style={{width : "4ch"}} readOnly disabled value={document.print_count}/>
                </TracershopInputGroup>
              </Col>
            </Row>
          </Col>
        </Row>
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

function ControlPanel({saveFunction}){
  const keys = [...Object.keys(TEMPLATE_RENDER_MAPPING)].map((key,i) => <li key={i}>{key}</li>)

  return <div>
    <h3> Et Dokument kan blive printet ved hver hætteglas.</h3>
    <h3> I dokumentet kan du referer til føglende dynamiske værdier fra hætteglasset:</h3>
    <ul>
      {keys}
    </ul>
    <IdempotentButton onClick={saveFunction}>Gem Dokument</IdempotentButton>
  </div>
}

enum DocumentEditorState {
  FETCHING,
  EDITING
};


type DocumentEditorProps = {
  selectedDocument : number
}

function DocumentEditor({selectedDocument} : DocumentEditorProps){
  const websocket = useWebsocket();
  const state = useTracershopState();
  const template = state.vial_template.get(selectedDocument);

  const [editorState, setEditorState] = useState(DocumentEditorState.FETCHING);
  const [text, setText] = useState("")

  useEffect(() => {
    setEditorState(DocumentEditorState.FETCHING)
    if(template.text === null){
      websocket.sendCreateModel(DATA_VIAL_TEMPLATE_TEXT, {}).then((response) => {
        if(response.messageType === WEBSOCKET_MESSAGE_UPDATE_STATE){
          websocket.sendEditModels(DATA_VIAL_TEMPLATE, {
            ...template,
            text : response.data.vial_template_text[0].id
          }).then(() => {
            setEditorState(DocumentEditorState.EDITING);
          });
        }
      });
    } else {
      websocket.sendGetModel(DATA_VIAL_TEMPLATE_TEXT, template.text).then((response) => {
        if (response.messageType === WEBSOCKET_MESSAGE_UPDATE_STATE) {
          setText(response.data.vial_template_text[0].text)
          setEditorState(DocumentEditorState.EDITING);
        }
      });
    }
  }, [selectedDocument])

  function saveDocument() {
    return websocket.sendEditModels(
      DATA_VIAL_TEMPLATE_TEXT,
      { id : template.text, text : text},
    );
  }

  return (
  <div>
    <Optional exists={editorState === DocumentEditorState.FETCHING}>
      <div style={{height : "10vh"}}></div>
      <center>
        <Spinner/>
      </center>
    </Optional>
    <Optional exists={editorState === DocumentEditorState.EDITING}>
      <Container>
        <Row>
          <Col xs={8}>
            <FormControl size="lg" as="textarea" onChange={setStateToEvent({stateFunction : setText})} value={text}></FormControl>
          </Col>
          <Col>
            <ControlPanel saveFunction={saveDocument}/>
          </Col>
        </Row>
      </Container>

    </Optional>
  </div>)
}

export function DocumentSetup({}){
  const state = useTracershopState();
  const [selectedDocument, setSelectedDocument] = useState<number>(null);

  return (
    <Container>
      <DocumentList selectedDocument={[selectedDocument, setSelectedDocument]}/>
      <Optional exists={selectedDocument != null}>
        <DocumentEditor selectedDocument={selectedDocument}/>
      </Optional>
    </Container>
  );
}