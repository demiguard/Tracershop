import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useWebsocket } from "~/contexts/tracer_shop_context";
import { deserialize } from "~/lib/serialization";
import { DATA_TELEMETRY_RECORD, DATA_TELEMETRY_REQUEST, WEBSOCKET_DATA } from "~/lib/shared_constants";

class VisualizedTelemetryRequest {
  constructor(telemetryRequest){
    this.id = telemetryRequest.id;
    this.message_key = telemetryRequest.message_key;
    this.display_name = telemetryRequest.display_name;

    this.requests = null;
    this.average_latency_ms = null;
    this.standard_deviation = null;
  }

  setData(data){
    // Data[0] is the id
    this.requests = data[1];
    this.average_latency_ms = data[2];
    this.standard_deviation = data[3];
  }
}

/**
 *
 * @param {Object} param0
 * @param { VisualizedTelemetryRequest } param0.telemetryRequest
 */
function RequestVisualizer({
  telemetryRequest
}){
  return (
  <Row>
    <Col>{telemetryRequest.message_key}</Col>
    <Col>{telemetryRequest.requests}</Col>
    <Col>{telemetryRequest.average_latency_ms.toFixed(3)}</Col>
    <Col>{telemetryRequest.standard_deviation.toFixed(3)}</Col>
  </Row>)
}

export function TelemetryVisualizer(){

  const websocket = useWebsocket();

  useEffect(function getTelemetryData(){
     websocket.sendGetTelemetry().then(
      (response) => {
        const data = deserialize(
          response[WEBSOCKET_DATA]
        );

        const formatted_telemetry_requests = new Map();
        for(const request of data[DATA_TELEMETRY_REQUEST]){
          formatted_telemetry_requests.set(request.id,
            new VisualizedTelemetryRequest(request)
          );
        }

        for(const dataTuple of response[WEBSOCKET_DATA][DATA_TELEMETRY_RECORD]){
          (formatted_telemetry_requests.get(dataTuple[0])).setData(dataTuple);
        }

        setTelemetryRequests(formatted_telemetry_requests);
      }
     )

    return () => {};
  },[])

  const [telemetryRequests, setTelemetryRequests] = useState(new Map());


  const renderedRequests = [];
  for(const request of telemetryRequests.values()){
    renderedRequests.push(
      <RequestVisualizer key={request.id} telemetryRequest={request}/>
    );
  }

  return (
    <Container>
      <Row>
        <Col><strong>Message</strong></Col>
        <Col><strong>Number of calls</strong></Col>
        <Col><strong>Average handle time in ms</strong></Col>
        <Col><strong>Standard deviation</strong></Col>
      </Row>
      {renderedRequests}
    </Container>
  );
}