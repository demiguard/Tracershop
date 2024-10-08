import datetime

from customer.lib.CustomTools import LMap
from customer.lib import calenderHelper
from customer.forms.forms import OrderForm

from customer.models import Booking, UserHasAccess, Location

def matchOrders(orders, runs):
  order_list = []
  used_orderID = []

  order_num = 1

  for run in runs:
    order_context = {
      'order_num' : order_num,
      'time' : run['dtime'],
      'hasComment' : False
    }
    order_num += 1

    matching_orders = list(filter(
      lambda x: calenderHelper.compare_hours(
        x['deliver_datetime'],
        run['dtime']),
      orders))
    
    for order in matching_orders:
      if order['comment'] != "" and order['comment'] != None:
        order_context['hasComment'] = True 
    if len(matching_orders): 
      used_orderID += LMap(lambda x: x['OID'], matching_orders)
      order_context['data_type'] = 'data'
      order_context['data'] = matching_orders
    else:
      order_context['data_type'] = 'form'
      order_context['data'] = OrderForm(run['dtime'], order_context["order_num"])
    
    order_list.append(order_context)

  return order_list

def FilterBookings(Customer, Date):
  locations = Location.objects.filter(AssignedTo=Customer)

  studies = {}

  for booking in Booking.objects.filter(startDate=Date).filter(location__in=locations).order_by("startTime"):
      if not(booking.procedure.inUse):
        continue
      TracerStr = str(booking.procedure.tracer)
      #Fill BookingInfo with Data to display in HTML file
      injectionDateTime = datetime.datetime.combine(datetime.date.today(), booking.startTime) 
      injectionTimeDelta = datetime.timedelta(seconds=60*booking.procedure.delay)
      injectionTime =  (injectionDateTime + injectionTimeDelta).time()

      bookingInfo = {
        'status' : booking.status,
        'accessionNumber' : booking.accessionNumber,
        'procedure' : str(booking.procedure),
        'studyTime' : booking.startTime.strftime("%H:%M"),
        'injectionTime' : injectionTime.strftime("%H:%M"),
        'location' : str(booking.location)
      }

      if TracerStr in studies:
        studies[TracerStr].append(bookingInfo)
      else:
        studies[TracerStr] = [bookingInfo]

  return studies

  