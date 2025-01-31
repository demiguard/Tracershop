import React, {useMemo, useContext, useRef, createContext } from "react";
import { useTracershopState } from "~/contexts/tracer_shop_context";
import { ReleaseRight, Tracer, User } from "~/dataclasses/dataclasses";
import { USER_GROUPS } from "~/lib/constants";




//#region ReleaseRightHolder
/**
 * This is a mapping over the various release rights a Production user have.
 * To determine if a user have rights to free a tracer:
 * @example
 * // Return true or false
 * const releaseRightHolder = new ReleaseRightHolder(user, releaseRights);
 * releaseRightHolder.permissionForTracer(tracer);
 */
export class ReleaseRightHolder {
  /** @type {Map} */_rightsMap
  /** @type {Boolean} */ _allowAll

  /**
   * This is a mapping over the various release rights a Production user have.
  * To determine if a user have rights to free a tracer:
  * @example
  * // Return true or false
  * const releaseRightHolder = new ReleaseRightHolder(user, releaseRights);
  * releaseRightHolder.permissionForTracer(tracer);
   * @param {User} user
   * @param {Map<Number, ReleaseRight>} releaseRights
   */
  constructor(user, releaseRights) {
    this._rightsMap = new Map();
    this._allowAll = user.user_group === USER_GROUPS.ADMIN;
    // While this class are personal, but that should be fine since it's a very rare
    // that users switch around.

    for(const releaseRight of releaseRights.values()){
      if(releaseRight.releaser !== user.id) {
        continue;
      }

      this._rightsMap.set(releaseRight.product, releaseRight.expiry_date);
    }
  }

  permissionForTracer(tracer, now){
    if(now === undefined){
      now = new Date();
    }

    if(tracer instanceof Tracer){
      tracer = tracer.id;
    }

    if(this._allowAll) {
      return true;
    }

    const expiry_date = this._rightsMap.get(tracer);

    if(expiry_date === undefined){
      return false;
    }

    if(expiry_date === null){
      return true;
    }

    return now < new Date(expiry_date);
  }
};

const userReleaseRightContext = createContext(new ReleaseRightHolder(new User(), new Map()));

export function UserReleaseRightProvider({ children }){
  const state = useTracershopState();
  const userReleaseRight = new ReleaseRightHolder(state.logged_in_user, state.release_right);

  return(
    <userReleaseRightContext.Provider value={userReleaseRight}>
      {children}
    </userReleaseRightContext.Provider>
  )
}

export function useUserReleaseRights(){
  return useContext(userReleaseRightContext);
}