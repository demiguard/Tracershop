import React, { useState } from 'react';
import { Card, Row, Col, Collapse, Container, Table } from 'react-bootstrap';
import { USER_GROUPS, cssAlignRight, cssCenter, cssError } from '~/lib/constants';
import { DATA_RELEASE_RIGHT, DATA_TRACER, DATA_USER } from '~/lib/shared_constants';

import { OpenCloseButton } from '../../injectable/open_close_button';
import { Select, toOptions } from '../../injectable/select';
import { setStateToEvent } from '~/lib/state_management';
import { DateInput } from '../../injectable/inputs/date_input';
import { ReleaseRight, Tracer, User } from '~/dataclasses/dataclasses';
import { ClickableIcon } from '../../injectable/icons';
import { TracerWebSocket } from '../../../lib/tracer_websocket';
import { parseDateInput } from '~/lib/user_input';
import { HoverBox } from '../../injectable/hover_box';
import { useTracershopState, useWebsocket } from '~/components/tracer_shop_context';

const SORTING_METHODS = {
  USER : 1,
  TRACER : 2,
  EXPIRY_DATE : 3,
}

function sortingFunction(method){
  return (releaseRightA, releaseRightB) => {
    switch (method) {
      case SORTING_METHODS.USER:
        return releaseRightA.releaser - releaseRightB.releaser;
      case SORTING_METHODS.TRACER:
        return releaseRightA.product - releaseRightB.product;
      case SORTING_METHODS.EXPIRY_DATE:
        const releaseRightADate = (releaseRightA.expiry_date) ?
                                    new Date(releaseRightA.expiry_date) :
                                    new Date("9999/12/31");
        const releaseRightBDate = (releaseRightB.expiry_date) ?
                                    new Date(releaseRightB.expiry_date) :
                                    new Date("9999/12/31");
        return (releaseRightADate < releaseRightBDate) ? 1 : -1;
    }
  }
}

export function FreeingRightsPage(){
  const state = useTracershopState();
  const websocket = useWebsocket();

  const [open, setOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryDateError, setExpiryDateError] = useState("");
  const [sortingMethod, setSortingMethod] = useState(SORTING_METHODS.USER);
  const userOptions = toOptions([...state.user.values()].filter(
    (user) => [USER_GROUPS.PRODUCTION_ADMIN, USER_GROUPS.PRODUCTION_USER].includes(user.user_group) &&
      user.id != state.logged_in_user.id), 'username', 'id')
  const initialUser = (userOptions.length) ? userOptions[0].value : -1;
  const [activeUserID, setActiveUserID] = useState(initialUser);
  const tracerOptions = toOptions([...state.tracer.values()].filter(
      (tracer) => !tracer.archived
  ), 'shortname', 'id');
  const initial_tracer = (tracerOptions.length) ? tracerOptions[0].value : -1;
  const [activeTracerID, setActiveTracerID] = useState(initial_tracer);

  function createReleaseRight(){
    let formattedExpiryDate;
    if(expiryDate === "") {
      formattedExpiryDate = null
    } else {
      const [valid, formattedDate] = parseDateInput(expiryDate, "Udløbsdatoen");

      if(valid) {
        formattedExpiryDate = formattedDate;
      } else {
        setExpiryDateError(formattedDate)
        return;
      }
    }

    setExpiryDateError("");
    websocket.sendCreateModel(DATA_RELEASE_RIGHT, [new ReleaseRight(
      undefined, formattedExpiryDate, activeUserID, activeTracerID
    )]).then(() => {setOpen(true);});
  }


  // Sub components
  /**
   * 
   * @param {{
   *  releaseRight : ReleaseRight,
   *  websocket : TracerWebSocket
   * }} param0 
   * @returns 
   */
  function ReleaseRightTableRow({releaseRight}){
    const user = state.user.get(releaseRight.releaser);
    const tracer = state.tracer.get(releaseRight.product);
    function deleteReleaseRight(){
      websocket.sendDeleteModel(DATA_RELEASE_RIGHT, releaseRight);
    }

    let expiryDate = "Aldrig";
    if (releaseRight.expiry_date){
      expiryDate = releaseRight.expiry_date;
    }

    return (<tr>
      <td>{user.username}</td>
      <td>{tracer.shortname}</td>
      <td>{expiryDate}</td>
      <td style={cssAlignRight}>
        <ClickableIcon 
          label={`delete-release-right-${releaseRight.id}`}
          src="static/images/decline.svg"
          onClick={deleteReleaseRight}/>
      </td>
    </tr>);
  }

  // So here we kinda get fucked by the fact double hover box, is not gonna work
  const expiryDateForm  = (expiryDateError !== "") ?
        <HoverBox
          Base={<DateInput
            aria-label="new-expiry-date"
            style={cssError}
            placeholder='Udløbsdato'
            value={expiryDate}
            stateFunction={setExpiryDate}
          />}
          Hover={<div>{expiryDateError}</div>}
        />
        : <HoverBox
            Base={<DateInput
              aria-label="new-expiry-date"
              placeholder='Udløbsdato'
              value={expiryDate}
              stateFunction={setExpiryDate}
            />}
            Hover={<div>Hvis der er ingen udløbsdato, varer rettigheden for evigt.</div>}
        />;

  const releaseRights = [...state.release_right.values()].sort(
    sortingFunction(sortingMethod)).map(releaseRight => <ReleaseRightTableRow
      key={releaseRight.id}
      releaseRight={releaseRight}
      websocket={websocket}
    />);

  return (
  <Container>
      <Card>
        <Card.Header>
          <Row>
            <Col><h3>Existerne Rettigheder</h3></Col>
            <Col style={cssAlignRight}
            ><OpenCloseButton
              open={open}
              setOpen={setOpen}
              label="open-existing-rights"
            />
            </Col>
          </Row>
        </Card.Header>
        <Collapse in={open}>
          <Table>
            <thead>
              <tr>
                <th
                  aria-label='sort-user'
                  onClick={() => {setSortingMethod(SORTING_METHODS.USER)}}>Frigiver</th>
                <th
                  aria-label='sort-tracer'
                  onClick={() => {setSortingMethod(SORTING_METHODS.TRACER)}}>Tracer</th>
                <th
                  aria-label='sort-expiry-date'
                  onClick={() => {setSortingMethod(SORTING_METHODS.EXPIRY_DATE)}}>Udløbsdato</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {releaseRights}
            </tbody>
          </Table>
        </Collapse>
      </Card>
    <Row><h2>Opret ny frigivelse rettigheder</h2></Row>
    <Row>
      <Col>
        <Select
          aria-label="new-user-select"
          options={userOptions}
          value={activeUserID}
          onChange={setStateToEvent(setActiveUserID)}
        />
      </Col>
      <Col>
      <Select
          aria-label="new-tracer-select"
          options={tracerOptions}
          value={activeTracerID}
          onChange={setStateToEvent(setActiveTracerID)}
        />
      </Col>
      <Col>
        {expiryDateForm}
      </Col>
      <Col style={cssCenter}>
        <ClickableIcon
          label="create-release-right"
          src="/static/images/plus.svg"
          onClick={createReleaseRight}
        />
      </Col>
    </Row>
  </Container>);
}


