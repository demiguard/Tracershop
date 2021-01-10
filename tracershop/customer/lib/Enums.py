from enum import Enum

class UseCaseEnum(Enum):
  Human = 1
  Dyr = 2
  Andet = 3
  
  @classmethod
  def choices(cls):
    return [(i, i.value) for i in cls]

USECASENAMING = ['Human', 'Dyr', 'Andet']
USECASEDBNAMEINGS = ['Human', 'Dyr', 'Andet']
  