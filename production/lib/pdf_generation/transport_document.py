# Python Standard library
from logging import getLogger

# Third party modules
## Django

## Report Lab

# Tracershop modules
from database.models import Customer
from lib.pdf_generation import TracershopCanvas

class TransportDocumentActivity(TracershopCanvas):
  def __init__(self, *args, **kwargs) -> None:
    super().__init__(*args, **kwargs)