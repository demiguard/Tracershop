#
TRACERSHOPDATABASENAME = 'TS_test'

#SQL CONSTANTS
TORDERS     = 'tOrders'
TORDERFORMS = 'tOrderForms'
DAILYRUNS   = 'dailyRuns'
FTGORDER    = 'FTGOrder'
MONTHORDER  = 'MonthlyOrder'
MONTHTORDER = 'MonthlyTOrder'
ACTIVECUSTOMER = 'ActiveCustomers'


SQLTuples = {
  TORDERS : [
    'status',
    'OrderID',
    'deliver_datetime',
    'nInjections',
    'use',
    'tracer',
    'userName'
  ],
  TORDERFORMS : [
    'name',
    'isotope',
    'nInjections',
    'orderBlock',
    'id'
  ],
  DAILYRUNS : [
    'repeat_t',
    'dtime',
    'max'
  ],
  FTGORDER : [
    'status',
    'OID',
    'ordered_amount',
    'deliver_datetime',
    'total_amount',
    'batchnr',
    'frigivet_amount',
    'frigivet_datetime',
    'comment',
    'userName'
  ],
  MONTHORDER : [
    'orderTime',
    'status'
  ],
  MONTHTORDER : [
    'orderTime',
    'statis'
  ],
  ACTIVECUSTOMER : [
    'Username',
    'ID'
  ]
}

####### Maybe To be moved into a Database ########

ORDERDEADLINEHOUR = 13
ORDERDEADLINEMIN = 00
ORDERDEADLINEDAY = 1

TORDERDEADLINEWEEKDAY = 2
TORDERDEADLINEHOUR = 11
TORDERDEADLINEMIN = 00
