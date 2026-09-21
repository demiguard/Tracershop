from datetime import datetime
from typing import Callable, Dict
import re

from database import models

def render_vial_template(
    vial: 'models.Vial',
    templateText: 'models.VialTemplateText'):
  """This function fills a template with a vial producing the text, that should
  be printed.

  Args:
      vial (models.Vial): _description_
      templateText (models.VialTemplateText): _description_
  """
  TEMPLATE_DIRECTORY: Dict[str, Callable[['models.Vial'], str]] = {
  r"$dato$" : lambda v : str(datetime.today().date()),
  r"$kunde-navn$" : lambda v : v.owner.short_name if v.owner is not None else "",
  r"$kunde-adresse$" : lambda v : v.owner.billing_address if v.owner is not None and v.owner.billing_address is not None else "",
  r"$kunde-by$" : lambda v : v.owner.billing_city if v.owner is not None and v.owner.billing_city is not None else "",
  r"$kunde-post-nummer$" : lambda v : v.owner.billing_zip_code if v.owner is not None and v.owner.billing_zip_code is not None else "",
  r"$kunde-email$" : lambda v : v.owner.billing_email if v.owner is not None and v.owner.billing_email is not None else "",
  r"$tracer-navn$" : lambda v : v.tracer.shortname if v.tracer is not None else "Ukendt Tracer",
  r"$tracer-klinisk-navn$" : lambda v : v.tracer.shortname if v.tracer is not None else "Ukendt Tracer",
  r"$hætteglas-aktivitet$" : lambda v : str(v.activity),
  r"$hætteglas-batch$" : lambda v : v.lot_number,
  r"$hætteglas-tid$" : lambda v : str(v.fill_time),
  r"$hætteglas-dato$" : lambda v : str(v.fill_date),
  r"$hætteglas-volume$" : lambda v : str(v.volume),
}

  pattern = re.compile("|".join(re.escape(k) for k in TEMPLATE_DIRECTORY.keys()))

  def replace(match : re.Match) -> str:
    key = match.group()
    return TEMPLATE_DIRECTORY[key](vial)

  return pattern.sub(replace, templateText.text)
