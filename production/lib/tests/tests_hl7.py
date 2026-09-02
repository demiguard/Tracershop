# Python standard library
from datetime import date
from testing import TracershopTestCase

# Third party libraries
from hl7 import parse as hl7_parse, Message

# Tracershop modules
from lib import hl7

class HL7TestCases(TracershopTestCase):

  def setUp(self) -> None:
    self.message_1: Message = hl7_parse("""MSH|^~\\&|Sectra|Sectra RIS|IBC-606|Veenstra|20240923130613||ORM^O01|3F138A25A954424FAFD89FAD773B1687-ORM|P|2.3.1\rPID|||||||19441004|M|||Dragstrupvej 62^^Gilleleje^^3250|270|||||||||||||||||"\rPV1|||""|||||||||||||\rORC|CA|||||||||||||||||||\rOBR||DKREGH0520210461|SECTRA1518617784|WDTPSFCXX_$15[+_$15^PET/CT, NaF Knogle (+)||||||||||||||||DKREGH0023459112||||||||||||^^^^^^264751000016001\r""")
    self.message_2: Message = hl7_parse("""MSH|^~\\&|Sectra|Sectra RIS|IBC-606|Veenstra|20240923123843||ORM^O01|AA632E60419940989BACDD0E7CADF6E6-ORM|P|2.3.1\rPID|||||||19410614|M|||Humlevej 20^^Allerød^^3450|201|||||||||||||||||""\rPV1|||""|||||||||||||\rORC|CA|||||||||||||||||||\rOBR||DKREGH0520378664|SECTRA1539720570|S_WHBSS99UF_$30^Myokardieskint., fysiol. prov., Tc-99m||||||||||||||||DKREGH0023637963||||||||||||^^^^^^220691000016004\r""")
    self.message_3: Message = hl7_parse("""MSH|^~\\&|Sectra|Sectra RIS|IBC-606|Veenstra|20240923122931||ORM^O01|FC06A833F12D4F8CBBBBDD96B2A9AFA2-ORM|P|2.3.1\rPID|||||||19470929|M|||Baeshøjgårdsvej 21^^Vig^^4560|306|||||||||||||||||""\rPV1|||""|||||||||||||\rORC|CA|||||||||||||||||||\rOBR||DKREGH0520081424|SECTRA1503940345|WDTPSCUXX_$15^PET/CT, Cu-64-DOTATATE (+)||||||||||||||||DKREGH0023322206||||||||||||^^^^^^256621000016000""") # type: ignore

  def test_extract_patient_birthdate(self):
    expected_1 = date(1944,10,4)
    expected_2 = date(1941,6,14)
    expected_3 = date(1947,9,29)

    self.assertEqual(hl7.extract_patient_birth_date(self.message_1), expected_1)
    self.assertEqual(hl7.extract_patient_birth_date(self.message_2), expected_2)
    self.assertEqual(hl7.extract_patient_birth_date(self.message_3), expected_3)
