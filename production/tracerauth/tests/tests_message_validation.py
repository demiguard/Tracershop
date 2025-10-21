from django.test.testcases import SimpleTestCase

from tracerauth.message_validation import Message,validate_message, Array, JsonBlueprint

class MessageValidationTestCases(SimpleTestCase):
  def test_flat_json(self):
    blueprint = Message({
      "this" : str,
      "is" : bool,
      "really" : int,
      "simple" : float,
    })

    # Ok, as god indented
    self.assertTrue(validate_message({
      "this" : "a string",
      "is" : False,
      "really" : 6782139,
      "simple" : 672903.1249710,
    }, blueprint))

    # Ordering Doesn't matter
    self.assertTrue(validate_message({
      "is" : False,
      "really" : 6782139,
      "simple" : 672903.1249710,
      "this" : "a string",
    }, blueprint))

    # Extra is ok
    self.assertTrue(validate_message({
      "An Extra is no problem" : None,
      "is" : False,
      "really" : 6782139,
      "simple" : 672903.1249710,
      "this" : "a string",
    }, blueprint))

    # Missing is not OK
    self.assertFalse(validate_message({
      "really" : 6782139,
      "simple" : 672903.1249710,
      "this" : "a string",
    }, blueprint))

    # Wrong Type is not ok
    self.assertFalse(validate_message({
      "is" : 1,
      "really" : 6782139,
      "simple" : 672903.1249710,
      "this" : "a string",
    }, blueprint))

  def test_nested_structures(self):
    blueprint = Message({
      "this" : {
        "is" : {
          "a" : {
            "valid" : {
              "json" : {
                "object" : {}
              }
            }
          }
        }
      }
    })

    self.assertTrue(validate_message({
      "this" : {
        "is" : {
          "a" : {
            "valid" : {
              "json" : {
                "object" : {}
              }
            }
          }
        }
      }
    }, blueprint))

    self.assertFalse(validate_message({
      "this" : False
    }, blueprint))

    self.assertFalse(validate_message({
      "this" : {
        "is" : False
      }
    }, blueprint))

  def test_validate_empty_message(self):
    self.assertTrue(validate_message({}, Message({})))

  def test_arrays_in_message_blueprints(self):
    blueprint = Message({
      "list" : Array(int)
    })

    self.assertTrue(validate_message({"list" : [1,2,3,4,5]}, blueprint))
    self.assertFalse(validate_message({"list" : ["1","2","3","4","5"]}, blueprint))
    self.assertFalse(validate_message({"list" : "[1,2,3,4,5]"}, blueprint))
