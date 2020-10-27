#
TRACERSHOPDATABASENAME = 'TS_test'

#SQL CONSTANTS
TORDERS     = 'tOrders'
TORDERFORMS = 'tOrderForms'
DAILYRUNS   = 'dailyRuns'
FTGORDER    = 'FTGOrder'
MONTHORDER  = 'MonthlyOrder'
ACTIVECUSTOMER = 'ActiveCustomers'

SQLTuples = {
  TORDERS : [
    'status',
    'OrderID',
    'deliver_datetime',
    'nInjections',
    'use',
    'tracer'
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
    'comment'
  ],
  MONTHORDER : [
    'orderTime',
    'status'
  ],
  ACTIVECUSTOMER : [
    'Username',
    'ID'
  ]
}