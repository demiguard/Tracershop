import mysql.connector as mysql

TSDBConfig = {
  'user' : "tracershop",
  'password' : "fdg4sale",
  'host' : "localhost",
  'port' : '5000',
  'database': "TS_test",
  'raise_on_warnings': True,
  'autocommit':True,
}

MYDBConfig = {
  'user' : "tracershop",
  'password' : "tracer",
  'host' : "localhost",
  'port' : '3306',
  'database': "tracerstore",
  'raise_on_warnings': True,
  'autocommit':True,
}


TSconn = mysql.connect(**TSDBConfig)
TScursor = TSconn.cursor()

MYconn = mysql.connect(**MYDBConfig)
MYcursor = MYconn.cursor()

########## ISOTOPE ###########################
SQLGETISOTOPES = f"""
  SELECT name, halflife, id
  from isotopes
"""
TScursor.execute(SQLGETISOTOPES)
isotopes = TScursor.fetchall()


for isotope in isotopes:
  SQLINSERTISOTOPES = f"""
  INSERT INTO customer_isotope(
    atomName, halftime, ID
  ) VALUES (
    \"{isotope[0]}\",{isotope[1]},{isotope[2]}
  )"""
  MYcursor.execute(SQLINSERTISOTOPES)

################################# TRACERS ############################
SQLGETTRACERS = """
SELECT id,
  name,
  isotope
FROM
  Tracers
WHERE
  in_use=1
"""
TScursor.execute(SQLGETTRACERS)
tracers = TScursor.fetchall()
for tracer in tracers:
  SQLINSERTTRACER = f"""
  INSERT INTO customer_tracer(
    ID, tracerName, inUse, isotope_id
  ) Values (
    {tracer[0]},\"{tracer[1]}\",1,{tracer[2]}
  )
  """
  try:
    MYcursor.execute(SQLINSERTTRACER)
  except:
    pass



