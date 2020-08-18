from customer.lib import calenderHelper
from customer.forms import OrderForm

def map_order_tuple(x):
  return {
    'status' : x[0],
    'orderID' : x[1],
    'ordered_amount': x[2],
    'total_amount' : x[4],
    'batchnr' : x[5],
    'free_amount' : x[6],
    'free_dt'  : x[7]
  }

def match_orders(orders, runs):
  order_list = []
  used_orderID = []

  order_num = 1

  for run in runs:
    order_context = {
      'order_num' : order_num,
      'time' : run[1]
    }
    order_num += 1

    matching_orders = list(filter(
      lambda x: calenderHelper.compare_hours(x[3],run[1]), orders))

    if len(matching_orders): 
      used_orderID += list(map(lambda x: x[1], matching_orders))
      order_context['data_type'] = 'data'
      order_context['data'] = map(map_order_tuple, matching_orders)
    else:
      order_context['data_type'] = 'form'
      order_context['data'] = OrderForm()
    
    order_list.append(order_context)


  return order_list