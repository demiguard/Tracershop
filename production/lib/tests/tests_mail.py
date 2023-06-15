""""""

__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
from datetime import datetime
import socket
from unittest import skip

# Third party packages
from django.test import TestCase

# Tracershop Production
from lib.mail import sendMail, validateEmailAddress, EmailHeader

from database import models



class mail_TestCase(TestCase):
  pass