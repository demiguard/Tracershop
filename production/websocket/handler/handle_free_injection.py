# Python Standard Library

# Third Party Module

# Tracershop Modules
from constants import MESSENGER_CONSUMER
from database.models import InjectionOrder, OrderStatus
from lib.utils import classproperty
from shared_constants import WEBSOCKET_SERVER_MESSAGES, WEBSOCKET_DATA,\
  WEBSOCKET_DATA_ID, DATA_INJECTION_ORDER, AUTH_IS_AUTHENTICATED,\
  WEBSOCKET_REFRESH, WEBSOCKET_MESSAGE_STATUS, DATA_AUTH, AUTH_USERNAME,\
  AUTH_PASSWORD,\
  WEBSOCKET_MESSAGE_ID, SUCCESS_STATUS_CRUD, WEBSOCKET_MESSAGE_TYPES
from tracerauth.message_validation import Message
from tracerauth.types import AuthenticationResult
from tracerauth.audit_logging import logFreeInjectionOrder
from websocket.handler_base import HandlerBase

class HandleFreeInjection(HandlerBase):
  @classproperty
  def blueprint(cls):
    return Message({
      DATA_AUTH : {
        AUTH_USERNAME : str,
        AUTH_PASSWORD : str
      },
      WEBSOCKET_DATA : {
        WEBSOCKET_DATA_ID : int,
        "lot_number" : str
      }
    })

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

    scoped_user = consumer.scope.get('user')
    if scoped_user is None or user != scoped_user:
      return await consumer._RejectFreeing(message)

    # Step 2
    order: InjectionOrder = await consumer.db.getModel(InjectionOrder, message[WEBSOCKET_DATA][WEBSOCKET_DATA_ID])
    order.lot_number = message[WEBSOCKET_DATA]['lot_number']
    order.freed_datetime = consumer.datetimeNow.now()
    order.freed_by = user
    order.status = OrderStatus.Released
    await consumer.db.saveModel(order, user) # Note this may fail!
    # Log the change to db
    logFreeInjectionOrder(user, order)

    # Step 3 Broadcast it

    await consumer.messenger(WEBSOCKET_SERVER_MESSAGES.WEBSOCKET_MESSAGE_UPDATE_PRIVILEGED_STATE,{
      MESSENGER_CONSUMER : consumer,
      AUTH_IS_AUTHENTICATED : True,
      WEBSOCKET_REFRESH : False,
      WEBSOCKET_MESSAGE_STATUS : SUCCESS_STATUS_CRUD.SUCCESS,
      WEBSOCKET_MESSAGE_ID : message[WEBSOCKET_MESSAGE_ID],
      WEBSOCKET_DATA : {
        DATA_INJECTION_ORDER : [order],
      },
    })
