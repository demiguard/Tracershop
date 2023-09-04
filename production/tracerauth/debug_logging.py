import logging

debug_logger = logging.getLogger('DebugLogger')

def debug_logging_decorator(func):
  def wrapper(*args, **kwargs):
    debug_logger.log(logging.DEBUG, f"{func.__name__} is begin called with args: {args}, kwargs:{kwargs}")
    return_value = func(*args, **kwargs)
    debug_logger.log(logging.DEBUG, f"{func.__name__} returned: {return_value}")
    return return_value
  return wrapper