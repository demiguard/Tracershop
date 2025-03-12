# Python Standard Library
from dataclasses import dataclass, field
from typing import Any, Dict

# Third party packages

# Tracershop Packages
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerReadTelemetry(MessengerBase):
  messenger_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_DATA : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_TELEMETRY
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_TELEMETRY

  @dataclass
  class Args(MessengerBase.MessageArgs):
    consumer: consumer.Consumer
    message_id : int
    telemetry_data: Dict[str, Any] = field(default_factory=dict)

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerCreateBooking call must be of type MessengerCreateBooking.Args")

    args.consumer.send_json(await MessageBlueprint.serialize({
      WEBSOCKET_MESSAGE_ID : args.message_id,
      WEBSOCKET_DATA : args.telemetry_data
    }))
