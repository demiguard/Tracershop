from datetime import time

def countMinutes(t1: time, t2:time) -> int:
  return (t2.hour - t1.hour) * 60 + t2.minute - t1.minute

def decay(halflife : float, minutes : int, MBq : float):
  halflifeMinutes = halflife / 60.0
  return MBq / (0.5) ** (minutes / halflifeMinutes)