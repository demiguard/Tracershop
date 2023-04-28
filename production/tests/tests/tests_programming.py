"""These Tests are mostly for my sake about how the python language works
   Mainly they exists to prove to myself how the threading module works,
   this is because in some other tests, I need to trigger race conditions.
   Race condition are very difficult to track down, therefore I'm creating
   some code where I can verify that an race condition have ocurred.
"""

__author__ = "Christoffer Vilstrup Jensen"

# Python standard library
from multiprocessing.connection import wait
import threading

# Django packages
from django.test import TestCase # Note most of these test doesn't really depent on django, it's just for integration purposes.

class ProgrammingTestCase(TestCase):
  def test_two_threads_one_dict(self): # yes, very sexy
    def write_to_dict(dict, kw, val):
      dict[kw] = val

      target_dict = {
        "kw_default" : "val_default"
      }
      thread_1 = threading.Thread(target=write_to_dict, args=(target_dict, "kw_1", "val_1"))
      thread_2 = threading.Thread(target=write_to_dict, args=(target_dict, "kw_2", "val_2"))

      thread_1.start()
      thread_2.start()

      thread_1.join()
      thread_2.join()

      self.assertDictEqual(target_dict, {
        "kw_default" : "val_default",
        "kw_1" : "val_1",
        "kw_2" : "val_2"
      })

  def test_basic_syncronization_t1_t2(self):
    """This test creates a que system between 2 threads"""
    e1 = threading.Event()
    e2 = threading.Event()
    target_list = []

    iter = 100

    def thread_func_1(L, objs, e1 : threading.Event, e2 : threading.Event):
        for i, obj in enumerate(objs):
            if i != 0:
                e2.wait()
                e2.clear()
            L.append(obj)
            e1.set()

    def thread_func_2(L, objs, e1, e2):
        for i, obj in enumerate(objs):
            e1.wait()
            e1.clear()
            L.append(obj)
            e2.set()

    thread_1 = threading.Thread(target=thread_func_1, args=(target_list, ["t1"] * iter, e1, e2))
    thread_2 = threading.Thread(target=thread_func_2, args=(target_list, ["t2"] * iter, e1, e2))

    thread_1.start()
    thread_2.start()

    thread_1.join()
    thread_2.join()

    self.assertListEqual(target_list,["t1","t2"] * iter)

  def test_basic_syncronization_t2_t1(self):
    """This test creates a que system between 2 threads"""

    e1 = threading.Event()
    e2 = threading.Event()
    thread_list = []

    iter = 100

    def thread_func_1(L, objs, e1 : threading.Event, e2 : threading.Event):
        for i, obj in enumerate(objs):
          if i != 0:
              e2.wait()
              e2.clear()
          L.append(obj)
          e1.set()

    def thread_func_2(L, objs, e1, e2):
      for i, obj in enumerate(objs):
        e1.wait()
        e1.clear()
        L.append(obj)
        e2.set()

    thread_1 = threading.Thread(target=thread_func_1, args=(thread_list, ["t1"] * iter, e1, e2))
    thread_2 = threading.Thread(target=thread_func_2, args=(thread_list, ["t2"] * iter, e1, e2))

    thread_2.start()
    thread_1.start()

    thread_1.join()
    thread_2.join()

    self.assertListEqual(thread_list,["t1","t2"] * iter)

  def test_circular_synchronization(self):
    """This test creates a que system between 3 threads where t1 waits on t2 which waits on t3 which waits on t1 and so fourth"""

    number_of_threads = 4
    iter = 10

    events = [threading.Event() for _ in range(number_of_threads)]
    thread_list = []

    def thread_func(L, objs, trigger_event, wait_event, startingThread):
      for i, obj in enumerate(objs):
        if not startingThread or i != 0:
          wait_event.wait()
          wait_event.clear()
        L.append(obj)
        trigger_event.set()

    threads = [threading.Thread(target=thread_func, args=(thread_list, ["t0"] * iter, events[0], events[number_of_threads - 1], True))]
    for i in range(1,number_of_threads):
      threads.append(
        threading.Thread(target=thread_func, args=(thread_list, ["t" + str(i)] * iter, events[i], events[(i - 1) % number_of_threads], False))
      )

    for t in threads:
      t.start()


    for t in threads:
      t.join()

    target_list = ["t"+ str(i) for i in range(number_of_threads)] * iter
    self.assertListEqual(thread_list, target_list)
