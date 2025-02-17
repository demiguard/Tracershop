# Python Standard Library

# Third Party Module

# Tracershop Modules
from shared_constants import WEBSOCKET_MESSAGE_FREE_ACTIVITY, WEBSOCKET_DATA,\
  DATA_DELIVER_TIME, DATA_ACTIVITY_ORDER, DATA_VIAL, AUTH_IS_AUTHENTICATED,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID

from tracerauth.types import AuthenticationResult
from tracerauth.audit_logging import logFreeActivityOrders

from websocket.handler_base import HandlerBase

class HandleFreeActivity(HandlerBase):
  message_type = WEBSOCKET_MESSAGE_FREE_ACTIVITY

  async def __call__(self, consumer, message):
    """Handler for freeing an activity order

      Args:
        message (Dict): Message send by the user with the fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_DELIVER_TIME_ID - ID of activity order time slot to be freed
            DATA_VIAL - A list of Vial ID that's being freed with this order
          DATA_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username

    """
    # This is 4 step function
    # 1. Authenticate, if fail return
    # 2. Assign vials to order
    # 3. update order
    # 4. Broadcast to users

    # Turn this into a function
    result, user = await consumer._authenticateFreeing(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    # Authentication successful update
    data = message[WEBSOCKET_DATA]
    orders, vials = await consumer.db.releaseOrders(data[DATA_DELIVER_TIME],
                                                data[DATA_ACTIVITY_ORDER],
                                                data[DATA_VIAL],
                                                user,
                                                consumer.datetimeNow.now())
    logFreeActivityOrders(user, orders, vials)
    customerIDs = await consumer.db.getCustomerIDs(orders)

    newState = await consumer.db.async_serialize_dict({
      DATA_ACTIVITY_ORDER : orders,
      DATA_VIAL : vials
    })

    await consumer._broadcastCustomer({
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_FREE_ACTIVITY,
      WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : newState,
    }, customerIDs)
