# Python Standard Library
from dataclasses import dataclass, field, make_dataclass
from typing import Any, Dict

# Third party packages

# Tracershop Packages
from constants import MESSENGER_CONSUMER
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_TYPE
from lib.utils import classproperty
from websocket.messenger_base import MessengerBase, MessageBlueprint, MessageDataField
from websocket import consumer

class MessengerReadTelemetry(MessengerBase):
  message_blueprint = MessageBlueprint({
    WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
    WEBSOCKET_MESSAGE_ID : MessageDataField(),
    WEBSOCKET_DATA : MessageDataField(),
    WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_TELEMETRY
  })

  @classproperty
  def message_type(cls):
    return WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_READ_TELEMETRY

  Args = make_dataclass('Args', fields=[
    (MESSENGER_CONSUMER, consumer.Consumer),
    (WEBSOCKET_MESSAGE_ID, int),
    (WEBSOCKET_DATA, Dict[str, Any], field(default_factory=dict))
  ])

  @classmethod
  def getMessageArgs(cls):
    return cls.Args

  @classmethod
  async def __call__(cls, args):
    if not isinstance(args, cls.Args):
      raise TypeError("MessengerReadTelemetry call must be of type MessengerReadTelemetry.Args")

    consumer_: consumer.Consumer = args[MESSENGER_CONSUMER]
    await consumer_.send_json(await cls.message_blueprint.serialize(args))
