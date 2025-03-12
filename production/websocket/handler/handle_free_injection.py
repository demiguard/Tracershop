# Python Standard Library

# Third Party Module

# Tracershop Modules
from database.models import InjectionOrder, OrderStatus
from lib.utils import classproperty
from shared_constants import WEBSOCKET_MESSAGE_FREE_INJECTION, WEBSOCKET_DATA,\
  WEBSOCKET_DATA_ID, DATA_INJECTION_ORDER, AUTH_IS_AUTHENTICATED,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_TYPE, WEBSOCKET_MESSAGE_SUCCESS,\
  WEBSOCKET_MESSAGE_ID, WEBSOCKET_MESSAGE_UPDATE_STATE, WEBSOCKET_MESSAGE_TYPES

from tracerauth.types import AuthenticationResult
from tracerauth.audit_logging import logFreeInjectionOrder

from websocket.handler_base import HandlerBase

class HandleFreeInjection(HandlerBase):
  @classproperty
  def message_type(cls):
    return WEBSOCKET_MESSAGE_TYPES.WEBSOCKET_MESSAGE_FREE_INJECTION

  async def __call__(self, consumer, message):
    """This function handles freeing Injection based orders

    Args:
        message (Dict): Message with the following fields
          WEBSOCKET_DATA - Dict with:
            KEYWORD_OID - ID of injection order to freed
            KEYWORD_BATCHNR - batch number of material.
          DATA_AUTH - Dict with:
            AUTH_USERNAME : username
            AUTH_PASSWORD : password for username
    """
    # This is 3 step function
    # 1. Authenticate, if fail return
    # 2. update order
    # 3. Broadcast to users

    # Step 1: Determine the user credentials are valid
    result, user = await consumer.authenticate_from_auth(message)

    if result != AuthenticationResult.SUCCESS:
      return await consumer._RejectFreeing(message)

    # Step 2
    order: InjectionOrder = await consumer.db.getModel(InjectionOrder, message[WEBSOCKET_DATA][WEBSOCKET_DATA_ID])
    order.lot_number = message[WEBSOCKET_DATA]['lot_number']
    order.freed_datetime = consumer.datetimeNow.now()
    order.freed_by = consumer.scope['user']
    order.status = OrderStatus.Released
    await consumer.db.saveModel(order, user) # Note this may fail!
    # Log the change to db
    logFreeInjectionOrder(user, order)

    # Step 3 Broadcast it

    await consumer.broadcastProduction({
        AUTH_IS_AUTHENTICATED : True,
        WEBSOCKET_REFRESH : False,
        WEBSOCKET_MESSAGE_TYPE : WEBSOCKET_MESSAGE_UPDATE_STATE,
        WEBSOCKET_MESSAGE_SUCCESS : WEBSOCKET_MESSAGE_SUCCESS,
        WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
        WEBSOCKET_DATA : {
          DATA_INJECTION_ORDER : [order],
        },
    })
