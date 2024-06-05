"""
"""

__author__ = "Christoffer Vilstrup Jensen"

# Standard Python Packages

# Third Party Packages
from django.db.models import BigAutoField, CharField, ForeignKey, RESTRICT

# Tracershop Packages
from database.TracerShopModels.baseModels import TracershopModel


class Address(TracershopModel):
  id = BigAutoField(primary_key=True)
  ip   = CharField(max_length=30, null=True)
  port = CharField(max_length=6, null=True)
  description = CharField(max_length=120,null=True)

  def __str__(self):
    if self.description:
      return self.description
    else:
      return self.ip + ':' + self.port

class DicomEndpoint(TracershopModel):
  id = BigAutoField(primary_key=True)
  address = ForeignKey(Address, on_delete=RESTRICT)
  ae_title = CharField(max_length=16)

  def __str__(self):
    return f"{self.ae_title} - {self.address.ip}:{self.address.port}"
