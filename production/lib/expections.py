
class SecurityException(Exception):
  def __init__(self, SecurityType):

    self.message = f"Security Issue encountered: {SecurityType}"

    super().__init__(self.message)


class SQLInjectionException(SecurityException):
  def __init__(self):
    super().__init__("SQL Injection Detected")



class DatabaseNotSetupException(Exception):
  pass

class DatabaseCouldNotConnect(Exception):
  pass