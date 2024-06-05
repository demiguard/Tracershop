# Python Standard Library
from datetime import time

# Thrid Party Packages

# Tracershop Packages
from database.models import Tracer

def countMinutes(t1: time, t2:time) -> int:
  return (t2.hour - t1.hour) * 60 + t2.minute - t1.minute

# This is a bad name!
def decay(halflife : float, minutes : int, MBq : float):
  halflifeMinutes = halflife / 60.0
  return MBq / (0.5) ** (minutes / halflifeMinutes)

def tracerDecayFactor(tracer: Tracer, seconds: float):
  return 0.5 ** (seconds / tracer.isotope.halflife_seconds)