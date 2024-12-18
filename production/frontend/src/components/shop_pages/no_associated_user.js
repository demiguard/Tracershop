/**This page is for when a shop user logs on, but isn't associated with any
 * customer. It's purpose is to inform the user, that it should contact
 * relevant people.
 */

import React from "react";
import { Container } from "react-bootstrap";
import { USER_GROUPS } from "../../lib/constants";
import { useTracershopState } from "../../contexts/tracer_shop_context";

export function NoAssociatedUser(props){
  const state = useTracershopState()
  const user = state.logged_in_user;

  if(user.user_group === USER_GROUPS.SHOP_EXTERNAL){
    return (
      <Container>
        <h3 aria-label="no-assoc-external-user-error">Du er logged ind men din konto er ikke forbundet til en kunde konto.</h3>
        <h3>Du skal kontakte kemien for at få din konto forbundet.</h3>
      </Container>);
  }

  return (
  <Container>
    <h3 aria-label="no-assoc-internal-user-error">
      Du er logged ind men din konto er ikke forbundet til en kunde konto.
      Du skal kontakte din lokale tracershop superbruger for at få din konto forbundet.
    </h3>
  </Container>);
}