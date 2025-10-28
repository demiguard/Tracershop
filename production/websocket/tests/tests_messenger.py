
# Thrid party modules
from django.test import SimpleTestCase

# Tracershop imports
from websocket.messenger import Messenger

class MessengerTestCases(SimpleTestCase):
  def setUp(self) -> None:
    self.messenger = Messenger()

  def test_messengers_are_typed_checked(self):
    for messenger in self.messenger.messengers.values():
      try:
        await messenger(1) # type: ignore
        self.assertTrue(False)
      except TypeError:
        pass
