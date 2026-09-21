# Python standard library

# Third party Modules
from django.test import SimpleTestCase

# Tracershop Modules
from lib.rendering import render_vial_template
from database.models import Vial, VialTemplate, VialTemplateText, Tracer, Customer

class TemplateTests(SimpleTestCase):
  """Test cases for parsing - Primarily for Transport documents

  No queries should be needed. This is a soft requirement, and is enforced by
  the fact this is a simpleTestCase
  """

  def test_rendering_without_keys(self):
    tracer = Tracer(shortname="SUP", clinical_name="HMMM")
    customer = Customer()
    vial = Vial(tracer=tracer,owner=customer, activity=1000.0)

    raw_text = "I'm a dummy, without keys!\t\n"

    text = VialTemplateText(text=raw_text)

    document_text = render_vial_template(vial, text)

    self.assertEqual(document_text, raw_text)

  def test_rendering_tracer_name(self):
    tracer = Tracer(shortname="SUP", clinical_name="HMMM")
    customer = Customer()
    vial = Vial(tracer=tracer,owner=customer, activity=1000.0)

    raw_text = "I'm a dummy, with $tracer-navn$!\t\n"

    text = VialTemplateText(text=raw_text)

    document_text = render_vial_template(vial, text)

    expected_text = "I'm a dummy, with SUP!\t\n"

    self.assertEqual(document_text, expected_text)

  def test_rendering_keys_are_case_sensitive(self):
      tracer = Tracer(shortname="SUP", clinical_name="HMMM")
      customer = Customer()
      vial = Vial(tracer=tracer,owner=customer, activity=1000.0)

      raw_text = "I'm a dummy, with $Tracer-navn$!\t\n"

      text = VialTemplateText(text=raw_text)

      document_text = render_vial_template(vial, text)

      expected_text = "I'm a dummy, with $Tracer-navn$!\t\n"

      self.assertEqual(document_text, expected_text)
