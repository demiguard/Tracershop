from django.db import connection

def ExecuteQueryFetchOne(SQLQuery : str):
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    FetchedVal = cursor.fetchone()
  return FetchedVal

def ExecuteQueryFetchAll(SQLQuery : str) -> list:
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)
    FetchedVals = list(cursor.fetchall())
  return FetchedVals

def ExecuteQuery(SQLQuery : str) -> None:
  with connection.cursor() as cursor:
    cursor.execute(SQLQuery)