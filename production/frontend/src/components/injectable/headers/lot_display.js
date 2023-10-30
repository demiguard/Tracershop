import React from "react"
import { HoverBox } from "../hover_box";

export function LotNumberHeader(){
  return <HoverBox
  Base={<div>Lot Nummer</div>}
  Hover={
    <div>En kode på formattet XXXX-YYMMDD-R
      <ul>
        <li>XXXX - Tracer kode, ikke nødvendigvis på 4 bogstaver</li>
        <li>YYMMDD - Dato kode</li>
        <li>R - Produktion af denne tracer på denne dato</li>
      </ul>
    </div>}
  />;
}
