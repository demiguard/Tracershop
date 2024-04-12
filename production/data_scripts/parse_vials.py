from typing import List
from database.models import Vial, Tracer, TracershopModel, Tuple, Type
from data_scripts.mapping import get_vial_user

tracer_map = {
  tracer.vial_tag : tracer for tracer in Tracer.objects.all()
}

def parse_vial(vial_line: str):
  dispenser_id, batch, not_used, fill_date, fill_time, volume, gros, tare, net,\
    product, ID, activity = vial_line.split(',')

  customer = get_vial_user(dispenser_id)

  vial_tag = batch.split('-')[0]

  tracer = tracer_map.get(vial_tag, None)

  vial = Vial(
    tracer=tracer,
    activity=float(activity),
    volume=float(volume),
    lot_number=batch,
    fill_time=fill_time,
    fill_date=fill_date,
    assigned_to=None,
    owner=customer
  )

  vial.validate_constraints()
  return vial

def parse_vials(file_content: List[str]) -> Tuple[List[TracershopModel],
                                                  Type[TracershopModel]]:
  vials = []
  for vial_line in file_content:
    vial = parse_vial(vial_line)
    vials.append(vial)

  return vials, Vial