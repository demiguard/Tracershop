from dataclasses import dataclass

import re
from typing import Union
import constants

from lib.ProductionDataClasses import ActivityOrderDataClass, CustomerDataClass, InjectionOrderDataClass
from database.models import ServerConfiguration

from smtplib import SMTP
from email import encoders

from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

@dataclass(frozen=True)
class EmailHeader:
  To      : str
  Subject : str
  message : str
  From    : str = constants.EMAIL_SENDER_ADDRESS

def validateEmailAddress(potentialEmail : str) -> bool:
  """
    Checks if an email address is valid:

    args:
      potentialEmail : str - the text string checking if it's a RFC 5322 Standard valid email

    returns
      bool - the outcome of the comparison. Note this is not a re.match object

  """
  emailRegex = r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)"
  if re.fullmatch(emailRegex, potentialEmail):
    return True
  return False

def prepareMail(emailHeader :EmailHeader, fileBytes):
  fname = "følgeseddel.pdf"

  mail = MIMEMultipart()
  mail["Subject"] = emailHeader.Subject
  mail["To"]      = emailHeader.To
  mail["From"]    = emailHeader.From

  text = MIMEText(emailHeader.message.encode("utf-8"),"plain", _charset="utf-8")

  mail.attach(text)
  payload = MIMEBase('application', 'octate-stream', Name=fname)
  payload.set_payload(fileBytes)

  encoders.encode_base64(payload)

  payload.add_header("Content-Decomposition", "attachment", filename=fname)
  mail.attach(payload)

  return mail


def sendMail(pdfPath : str, Customer : CustomerDataClass, Order: Union[ActivityOrderDataClass, InjectionOrderDataClass], serverConfiguration : ServerConfiguration):
  emails = [Customer.email, Customer.email2, Customer.email3, Customer.email4]

  Text_message = "Dette er en føgleseddel til tracershop."
  subject_message = f"Følgeseddel - {Order.oid}"

  with open(pdfPath, 'rb') as f:
    fileBytes = f.read()

  for email in emails:
    if not validateEmailAddress(email):
      continue #pragma: no cover

    Header = EmailHeader(
      To=email,
      Subject=subject_message,
      message=Text_message
    )

    mail = prepareMail(Header, fileBytes)

    ip = str(ServerConfiguration.SMTPServer)

    with SMTP(ip) as smtp:
      smtp.sendmail(constants.EMAIL_SENDER_ADDRESS, [email], mail.as_string()) #pragma: no cover
