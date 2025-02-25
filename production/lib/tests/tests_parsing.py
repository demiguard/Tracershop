"""Test cases from vial parsing."""

__author__ = "Christoffer Vilstrup Jensen"

# Python Standard library
from datetime import date, time
from logging import getLogger, Logger, DEBUG

# Third party packages
from django.test import TestCase, TransactionTestCase
import hl7

# Tracershop packages
from constants import DEBUG_LOGGER
from database.models import Customer, Isotope, Tracer, TracerTypes, Vial,\
  UserGroups
from lib.parsing import update_customer_mapping, update_tracer_mapping,\
  parse_val_file, _parse_customer, extract_deleted_accessionNumber,\
  parse_index_header

class ParsingTestCase(TestCase):
  def setUp(self) -> None:
    self.isotope = Isotope.objects.create(id=1,
                                     atomic_number=9,
                                     atomic_mass=18,
                                     halflife_seconds=107.2,
                                     atomic_letter='F')

    self.fdg = Tracer.objects.create(id=1, isotope=self.isotope, shortname="FDG", clinical_name="FDG_C", tracer_type=TracerTypes.ActivityBased, vial_tag="FDGF")
    self.fet = Tracer.objects.create(id=2, isotope=self.isotope, shortname="FET", clinical_name="FET_C", tracer_type=TracerTypes.ActivityBased, vial_tag="FET")

    self.fling = Customer.objects.create(id=1, short_name="fling", long_name="Flemming Andersen", dispenser_id=None)
    self.test_kunde = Customer.objects.create(id=2, short_name="test_kunde", long_name="Flemming Andersen", dispenser_id=1015)
    self.herlev = Customer.objects.create(id=3, short_name="herlev", long_name="Amtsygehuset i Herlev", dispenser_id=2)
    self.petrh = Customer.objects.create(id=4, short_name="petrh", long_name="Rigshospitalet", dispenser_id=1)
    self.gentofte = Customer.objects.create(id=5, short_name="gentofte", long_name="Gentofte Hospital", dispenser_id=3)
    self.glostrup = Customer.objects.create(id=6, short_name="glostrup", long_name="Rigshospitalet, Glostrup", dispenser_id=4)
    self.hilleroed = Customer.objects.create(id=7, short_name="hilleroed", long_name="KFNA Hilleroed", dispenser_id=5)
    self.bispebjerg = Customer.objects.create(id=8, short_name="bispebjerg", long_name="Bispebjerg Hospital", dispenser_id=6)
    self.lund = Customer.objects.create(id=9, short_name="lund", long_name="Lund University Hospital", dispenser_id=7)
    self.nru = Customer.objects.create(id=10, short_name="nru", long_name="Neurobiologisk Forskningsenhed ", dispenser_id=9)
    self.aarhus = Customer.objects.create(id=11, short_name="aarhus", long_name="Pet Centret", dispenser_id=8)
    self.goteborg = Customer.objects.create(id=12, short_name="goteborg", long_name="Göteborg", dispenser_id=10)
    self.odense = Customer.objects.create(id=13, short_name="odense", long_name="Odense Universitetshospital", dispenser_id=11)
    self.hvidovre = Customer.objects.create(id=14, short_name="hvidovre", long_name="Hvidovre hospital", dispenser_id=12)
    self.vejle = Customer.objects.create(id=15, short_name="vejle", long_name="Vejle Sygehus", dispenser_id=13)
    self.nved = Customer.objects.create(id=16, short_name="nved", long_name="Næstved Sygehus", dispenser_id=14)
    self.petf2 = Customer.objects.create(id=17, short_name="petf2", long_name="PET Finsens II", dispenser_id=16)
    self.koge = Customer.objects.create(id=18, short_name="koge", long_name="Koge Sygehus", dispenser_id=17)
    self.hamlet = Customer.objects.create(id=19, short_name="hamlet", long_name="Privathospitalet Hamlet", dispenser_id=18)
    self.malmo = Customer.objects.create(id=20, short_name="malmo", long_name="Skaanes Universitetssjukhus", dispenser_id=19)
    self.fu = Customer.objects.create(id=21, short_name="fu", long_name="Forskning og Udvikling", dispenser_id=20)
    self.kf = Customer.objects.create(id=22, short_name="kf", long_name="Klin fys 4011", dispenser_id=15)
    self.life = Customer.objects.create(id=23, short_name="life", long_name="LIFE, Det Biovidenskabelige Fakultet, KU", dispenser_id=21)
    self.pet7 = Customer.objects.create(id=24, short_name="pet7", long_name="PET7", dispenser_id=  25)
    self.ctn = Customer.objects.create(id=25, short_name="ctn", long_name="Center for Translationel Neuroscience", dispenser_id=22)
    self.minerva = Customer.objects.create(id=26, short_name="minerva", long_name="Minerva Imaging", dispenser_id=23)
    self.petq = Customer.objects.create(id=27, short_name="petq", long_name="PET 7 9 10", dispenser_id=24)

    update_customer_mapping()
    update_tracer_mapping()

  def tearDown(self) -> None:
    Customer.objects.all().delete()
    Tracer.objects.all().delete()
    Isotope.objects.all().delete()

  def test_customer_parse(self):
    newVial = Vial()
    logger = getLogger()
    with self.assertLogs(logger, DEBUG) as cm:
      _parse_customer("customer:   1-Rigshospitalet1", newVial, logger)
    self.assertEqual(newVial.owner, self.petrh)


  def test_petrh_val_file(self):
    val_content=[
      "customer:   1-Rigshospitalet1",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:45:05",
      "activity:   13233 MBq;  ",
      "volume:     7.89 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]
    vial = parse_val_file(val_content, logger=getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 13233)
    self.assertEqual(vial.volume, 7.89)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 45,5))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.petrh)

  def test_petrh2_val_file(self):
    val_content=[
      "customer:   16-Rigshospitalet2",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:39:23",
      "activity:   11407 MBq;  ",
      "volume:     12.90 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]
    vial = parse_val_file(val_content, logger=getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 11407)
    self.assertEqual(vial.volume, 12.9)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 39,23))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.petf2)

  def test_petq_val_file(self):
    val_content = [
      "customer:   24-petq",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:30:43",
      "activity:   8965 MBq;  ",
      "volume:     7.84 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]

    vial = parse_val_file(val_content, logger=getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 8965)
    self.assertEqual(vial.volume, 7.84)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 30,43))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.petq)

  def test_Hvidovre_val_file(self):
    val_content = [
      "customer:   12-Hvidovre Hospital",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:14:27",
      "activity:   13569 MBq;  ",
      "volume:     7.86 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]

    vial = parse_val_file(val_content, logger=getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 13569)
    self.assertEqual(vial.volume, 7.86)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 14,27))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.hvidovre)

  def test_Glostrup_val_file(self):
    val_file = ["customer:   4-Glostrup Hospital",
                "part:       0",
                "charge:     FDGF-240124-1",
                "depotpos:   0",
                "filldate:   24.01.24",
                "filltime:   08:12:04",
                "activity:   15041 MBq;  ",
                "volume:     7.86 ml",
                "gros:       0 g",
                "tare:       0 g",
                "net:        0 g",
                "product:    18F",
                "use_before: 24/01/24 17:30",
                "dispenser:  UK465",
    ]

    vial = parse_val_file(val_file, getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 15041)
    self.assertEqual(vial.volume, 7.86)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 12, 4))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.glostrup)

  def test_KF_val_file(self):
    val_file = [
      "customer:   15-KF",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:18:17",
      "activity:   7865 MBq;  ",
      "volume:     5.11 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]

    vial = parse_val_file(val_file, getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 7865)
    self.assertEqual(vial.volume, 5.11)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 18, 17))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.kf)

  def test_Køge_val_file(self):
    val_file = [
      "customer:   17-Køge Sygehus",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:09:56",
      "activity:   12786 MBq;  ",
      "volume:     6.20 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]

    vial = parse_val_file(val_file, getLogger())
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 12786)
    self.assertEqual(vial.volume, 6.2)
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.fill_time, time(8, 9, 56))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.koge)

  def test_Hillerød_val_file(self):
    val_file = [
      "customer:   5-Hillerød Hospital",
      "part:       0",
      "charge:     FDGF-240124-1",
      "depotpos:   0",
      "filldate:   24.01.24",
      "filltime:   08:02:27",
      "activity:   18825 MBq;  ",
      "volume:     8.61 ml",
      "gros:       0 g",
      "tare:       0 g",
      "net:        0 g",
      "product:    18F",
      "use_before: 24/01/24 17:30",
      "dispenser:  UK465",
    ]

    vial = parse_val_file(val_file, getLogger())
    self.assertEqual(vial.lot_number, "FDGF-240124-1")
    self.assertEqual(vial.tracer, self.fdg)
    self.assertEqual(vial.activity, 18825)
    self.assertEqual(vial.volume, 8.61)
    self.assertEqual(vial.fill_time, time(8, 2, 27))
    self.assertEqual(vial.fill_date, date(2024,1,24))
    self.assertEqual(vial.assigned_to, None)
    self.assertEqual(vial.owner, self.hilleroed)

  def test_extract_deleted_accessionNumber(self):
    message_1 = hl7.parse("""MSH|^~\&|Sectra|Sectra RIS|IBC-606|Veenstra|20240923130613||ORM^O01|3F138A25A954424FAFD89FAD773B1687-ORM|P|2.3.1\rPID|||||||19441004|M|||Dragstrupvej 62^^Gilleleje^^3250|270|||||||||||||||||"\rPV1|||""|||||||||||||\rORC|CA|||||||||||||||||||\rOBR||DKREGH0520210461|SECTRA1518617784|WDTPSFCXX_$15[+_$15^PET/CT, NaF Knogle (+)||||||||||||||||DKREGH0023459112||||||||||||^^^^^^264751000016001\r""")
    message_2 = hl7.parse("""MSH|^~\&|Sectra|Sectra RIS|IBC-606|Veenstra|20240923123843||ORM^O01|AA632E60419940989BACDD0E7CADF6E6-ORM|P|2.3.1\rPID|||||||19410614|M|||Humlevej 20^^Allerød^^3450|201|||||||||||||||||""\rPV1|||""|||||||||||||\rORC|CA|||||||||||||||||||\rOBR||DKREGH0520378664|SECTRA1539720570|S_WHBSS99UF_$30^Myokardieskint., fysiol. prov., Tc-99m||||||||||||||||DKREGH0023637963||||||||||||^^^^^^220691000016004\r""")
    message_3 = hl7.parse("""MSH|^~\&|Sectra|Sectra RIS|IBC-606|Veenstra|20240923122931||ORM^O01|FC06A833F12D4F8CBBBBDD96B2A9AFA2-ORM|P|2.3.1\rPID|||||||19470929|M|||Baeshøjgårdsvej 21^^Vig^^4560|306|||||||||||||||||""\rPV1|||""|||||||||||||\rORC|CA|||||||||||||||||||\rOBR||DKREGH0520081424|SECTRA1503940345|WDTPSCUXX_$15^PET/CT, Cu-64-DOTATATE (+)||||||||||||||||DKREGH0023322206||||||||||||^^^^^^256621000016000""")

    self.assertEqual(extract_deleted_accessionNumber(message_1['OBR'][0]),"DKREGH0023459112")
    self.assertEqual(extract_deleted_accessionNumber(message_2['OBR'][0]),"DKREGH0023637963")
    self.assertEqual(extract_deleted_accessionNumber(message_3['OBR'][0]),"DKREGH0023322206")

  def test_cannot_parse_nonsense(self):
    not_a_val_file = [
      "today is a good day to die"
    ]

    logger = getLogger(DEBUG_LOGGER)

    with self.assertLogs(DEBUG_LOGGER):
      vial = parse_val_file(not_a_val_file, logger)

  def test_empty_file(self):
    not_a_val_file = [
      "customer:   ",
      "part:       ",
      "charge:     ",
      "depotpos:   ",
      "filldate:   ",
      "filltime:   ",
      "activity:   ",
      "volume:     ",
      "gros:       ",
      "tare:       ",
      "net:        ",
      "product:    ",
      "use_before: ",
      "dispenser:  ",
    ]

    logger = getLogger(DEBUG_LOGGER)

    with self.assertLogs(DEBUG_LOGGER):
      vial = parse_val_file(not_a_val_file, logger)


  def test_not_a_lot_number_file(self):
    not_a_val_file = [
      "customer:   ",
      "part:       ",
      "charge:     test",
      "depotpos:   ",
      "filldate:   ",
      "filltime:   ",
      "activity:   ",
      "volume:     ",
      "gros:       ",
      "tare:       ",
      "net:        ",
      "product:    ",
      "use_before: ",
      "dispenser:  ",
    ]

    logger = getLogger(DEBUG_LOGGER)

    with self.assertLogs(DEBUG_LOGGER):
      vial = parse_val_file(not_a_val_file, logger)


  def test_header_defaults_on_empty_values(self):
    bogus_header = { }

    user_group, username = parse_index_header(bogus_header)

    self.assertEqual(user_group, UserGroups.Anon)
    self.assertEqual(username, "")

  def test_header_defaults_on_empty_header(self):
    bogus_header = {
      'X-Tracer-Role' : ""
    }

    user_group, username = parse_index_header(bogus_header)

    self.assertEqual(user_group, UserGroups.ShopExternal)
    self.assertEqual(username, "")