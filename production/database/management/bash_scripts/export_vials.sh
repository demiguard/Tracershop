#!/bin/bash

if [[ $# -ne 1 ]]; then
  echo "usage fill-date"
  exit 1
fi

query="'select * from VAL where filldate > '$1' and filldate < '2030-01-01''"
#echo $query

mysql -D TracerShop -h 127.0.0.1 -P 5000 -B -e $query | tr '\t' ',' > vials.csv
