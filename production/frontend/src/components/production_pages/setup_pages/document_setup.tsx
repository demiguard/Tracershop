import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { Optional } from "~/components/injectable/optional";
import { useTracershopState } from "~/contexts/tracer_shop_context";


function DocumentList({ selectedDocument : selectedDocumentState }){
  const state = useTracershopState();

  const [selectedDocument, setSelectedDocument] = selectedDocumentState


  return (
    <Container>

    </Container>
  );
}

function HelperBlock(){
  return <div>
    <h2> I dokumentet kan du referer til føglende dynamiske værdier:</h2>
    <ul>
      <li> $dato$ </li>
      <li> $kunde-navn$ </li>
      <li> $kunde-adresse$</li>
      <li> $kunde-by$ </li>
      <li> $kunde-post-nummer$</li>
      <li> $kunde-email$ </li>
      <li> $tracer-navn$ </li>
      <li> $tracer-klinisk-navn$ </li>
      <li> $hætteglas-aktivitet$</li>
      <li> $hætteglas-batch$</li>
      <li> $hætteglas-tid$ </li>
      <li> $hætteglas-dato$ </li>
      <li> $hætteglas-volume$ </li>
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