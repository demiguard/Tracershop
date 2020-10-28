from customer.lib import calenderHelper
from customer.forms.forms import OrderForm

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
      used_orderID += list(map(lambda x: x['OID'], matching_orders))
      order_context['data_type'] = 'data'
      order_context['data'] = matching_orders
    else:
      order_context['data_type'] = 'form'
      order_context['data'] = OrderForm()
    
    order_list.append(order_context)

  return order_list