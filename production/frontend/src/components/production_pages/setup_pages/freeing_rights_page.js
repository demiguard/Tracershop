import React, {useState} from 'react';
import { Card, FormControl, Row, Col, Collapse, Container, Table } from 'react-bootstrap';
import { JSON_RELEASE_RIGHT, JSON_TRACER, JSON_USER, PROP_WEBSOCKET, USER_GROUPS, cssAlignRight, cssError } from '../../../lib/constants';
import { OpenCloseButton } from '../../injectable/open_close_button';
import { Select, toOptions } from '../../injectable/select';
import { setStateToEvent } from '../../../lib/state_management';
import { DateInput } from '../../injectable/date_input';
import { ReleaseRight, Tracer, User } from '../../../dataclasses/dataclasses';
import { ClickableIcon } from '../../injectable/icons';
import { TracerWebSocket } from '../../../lib/tracer_websocket';
import { parseDateInput } from '../../../lib/user_input';
import { HoverBox } from '../../injectable/hover_box';

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

export function FreeingRightsPage(props){
  const [open, setOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryDateError, setExpiryDateError] = useState("");
  const [sortingMethod, setSortingMethod] = useState(SORTING_METHODS.USER);
  const userOptions = toOptions([...props[JSON_USER].values()].filter(
    (user) => [USER_GROUPS.PRODUCTION_ADMIN, USER_GROUPS.PRODUCTION_USER].includes(user.user_group)
    ), 'username', 'id')
    const initialUser = (userOptions.length) ? userOptions[0].value : -1;
  const [activeUserID, setActiveUserID] = useState(initialUser);
  const tracerOptions = toOptions([...props[JSON_TRACER].values()].filter(
      (tracer) => !tracer.archived
  ), 'shortname', 'id');
  const initial_tracer = (tracerOptions.length) ? tracerOptions[0].value : -1;
  const [activeTracerID, setActiveTracerID] = useState(initial_tracer);

  function createReleaseRight(){
    let formattedExpiryDate
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
    props[PROP_WEBSOCKET].sendCreateModel(JSON_RELEASE_RIGHT, [new ReleaseRight(
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
  function ReleaseRightTableRow({releaseRight, websocket}){
    const /**@type {User} */ user = props[JSON_USER].get(releaseRight.releaser)
    const /**@type {Tracer} */ tracer = props[JSON_TRACER].get(releaseRight.product)
    function deleteReleaseRight(){
      websocket.sendDeleteModel(JSON_RELEASE_RIGHT, releaseRight)
    }

    let expiryDate = "Aldrig"
    if (releaseRight.expiry_date){
      expiryDate = releaseRight.expiry_date
    }

    return (<tr>
      <td>{user.username}</td>
      <td>{tracer.shortname}</td>
      <td>{expiryDate}</td>
      <td style={cssAlignRight}>
        <ClickableIcon src="static/images/decline.svg" onClick={deleteReleaseRight}/>
      </td>
    </tr>)
  }

  const expiryDateForm  = (expiryDateError !== "") ?
        <HoverBox
          Base={<DateInput
            style={cssError}
            placeholder='Udløbsdato'
            value={expiryDate}
            stateFunction={setExpiryDate}
          />}
          Hover={<div>{expiryDateError}</div>}
        />
        : <DateInput
            placeholder='Udløbsdato'
            value={expiryDate}
            stateFunction={setExpiryDate}
          />

  const releaseRights = [...props[JSON_RELEASE_RIGHT].values()].sort(
    sortingFunction(sortingMethod)).map(releaseRight => <ReleaseRightTableRow
      key={releaseRight.id}
      releaseRight={releaseRight}
      websocket={props[PROP_WEBSOCKET]}
    />)

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
                <th>Frigiver</th>
                <th>Tracer</th>
                <th>Udløbsdato</th>
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
      <Col>
        <ClickableIcon src="/static/images/accept.svg" onClick={createReleaseRight}/>
      </Col>
    </Row>
  </Container>);
}


