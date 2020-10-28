import datetime

from customer.lib.CustomTools import LMap
from customer.lib import calenderHelper
from customer.forms.forms import OrderForm

from customer.models import Booking, CustomerUsesLocation, UserHasAccess

def matchOrders(orders, runs):
  order_list = []
  used_orderID = []

  order_num = 1

  for run in runs:
    order_context = {
      'order_num' : order_num,
      'time' : run['dtime']
    }
    order_num += 1

    matching_orders = list(filter(
      lambda x: calenderHelper.compare_hours(
        x['deliver_datetime'],
        run['dtime']),
      orders))

    if len(matching_orders): 
      used_orderID += LMap(lambda x: x['OID'], matching_orders)
      order_context['data_type'] = 'data'
      order_context['data'] = matching_orders
    else:
      order_context['data_type'] = 'form'
      order_context['data'] = OrderForm()
    
    order_list.append(order_context)

  return order_list

def FilterBookings(Customer, Date):
  locations = LMap(lambda x : x.location, CustomerUsesLocation.objects.filter(customer=Customer))

  studies = {}

  for booking in Booking.objects.filter(startDate=Date).filter(location__in=locations).order_by("startTime"):
      TracerStr = str(booking.procedure.tracer)
      #Fill BookingInfo with Data to display in HTML file
      injectionDateTime = datetime.datetime.combine(datetime.date.today(), booking.startTime) 
      injectionTimeDelta = datetime.timedelta(seconds=60*booking.procedure.delay)
      injectionTime =  (injectionDateTime + injectionTimeDelta).time()

      bookingInfo = {
        'accessionNumber' : booking.accessionNumber,
        'procedure' : str(booking.procedure),
        'studyTime' : booking.startTime.strftime("%H:%M"),
        'injectionTime' : injectionTime.strftime("%H:%M")
      }

      if TracerStr in studies:
        studies[TracerStr].append(bookingInfo)
      else:
        studies[TracerStr] = [bookingInfo]

  return studies

def FindActiveCustomer(user):
  customers = LMap(
    lambda x: x.CustomerID, 
    UserHasAccess.objects.filter(userID=user).order_by('CustomerID')
  )
  if customers:
    return customers, customers[0]  
  else:
    return customers, None

  