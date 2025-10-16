import React, { ComponentProps } from "react";
import { DISPLAY_STATUS } from "~/lib/constants";
import { ValueOf } from "~/lib/types";
import { CommitIcon } from "./commit_icon";
import { CancelIcon } from "./icons";

type CommandProductionIconProps = {
  displayStatus : ValueOf<DISPLAY_STATUS>
} & ComponentProps<typeof CommitIcon>;

export function CommandProductionIcon({
  displayStatus,
  validate,
  temp_object,
  object_type

}: CommandProductionIconProps){
  switch (displayStatus){
    case DISPLAY_STATUS.STATIC:
      return <div></div>
    case DISPLAY_STATUS.EDITING:
      return <CommitIcon
        validate={validate}
        temp_object={temp_object}
        object_type={object_type}
      />
    case DISPLAY_STATUS.DISPLAY:
      return <CancelIcon order={temp_object}/>;
  }
}