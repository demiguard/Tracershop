import { object } from "prop-types";
import React, { useState } from "react";
import { Card, Container } from "react-bootstrap";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { TracershopState } from "~/dataclasses/dataclasses";


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
  const documentsCards = [...state.vial_template.values()].map((doc) => <DocumentCard selectedDocumentState={selectedDocumentState} key={doc.id} document={doc}/>)

  return (
    <Container>
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

    </Container>
  );
}