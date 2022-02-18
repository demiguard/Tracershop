from dataclasses import dataclass

import email
import smtplib
import ssl
import re
import typing

import constants
from constants import EmailEvents

from lib.SQL import SQLController as SQL

from api.models import ServerConfiguration

from smtplib import SMTP
from email import encoders

from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

@dataclass(frozen=True)
class EmailHeader:
  From    : str = constants.emailSenderAddress
  To      : str
  Subject : str
  message : str

def validifyEmailAddress(potentialEmail : str) -> bool:
  """
    Checks if an email address is valid:

    args:
      potentialEmail : str - the text string checking if it's a RFC 5322 Standard valid email

    returns
      bool - the outcome of the comparision. Note this is not a re.match object

  """
  emailRegex = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
  if re.fullmatch(emailRegex, potentialEmail):
    return True
  return False  


def prepareMailWithFile(emailHeader : EmailHeader):
  pass

def prepareMail(emailHeader :  EmailHeader):
  mail = MIMEText(emailHeader.message.encode("utf-8"), _charset="utf-8")
  mail["Subject"] = emailHeader.Subject
  mail["To"]      = emailHeader.To
  mail["From"]    = emailHeader.From
  
  return mail.as_string()

def sendMailToCustomer(Customer : dict, emailType : EmailEvents ):
  """
    
  Args:
    Customer : Dict - Corosponding to an entry in the Users Table



  """
  pass


def sendMail(mail, emailAddress):
  if not validifyEmailAddress(emailAddress):
    #Log this
    return

  ServerConfiguration = SQL.getServerConfig()

  if ServerConfiguration.ExternalDatabase.testinDatabase:
    raise ValueError("Testing Databases should never send emails.")

  with SMTP(ServerConfiguration.SMTPServer) as smtp:
    smtp.sendmail(constants.emailSenderAddress, [emailAddress], mail)