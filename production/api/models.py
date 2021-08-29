from django.db import models
from api.ModelsDir.BaseModels import SubscribeableModel

from api.ModelsDir.NetworkModels import Address, Database

class EmailTemplate(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  mailtext = models.TextField(null=True)
  descriptions = models.TextField(null=True)
