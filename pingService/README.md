# Ping Service
### Purpose
This service is an extention to tracershop. It pings a Service Class Provider **(SCP)** for DICOM images. Extracts the information and places it in a mysql database.
it's will make SQL queries to the main Django database. If you have not set this up yet then this service will not work. This service might break if you modify the following tables/collumns in the django with out touching this Service. This is a hard dependency, because django is shit at having service threads.
<li> customer_aet
<li> customer_address
<li> customer_booking

### Requirements
Inheritted from Tracershop but otherwise the PYPI-packages:
<li> mysql.connector-python===8.0.21
<li> pydicom==2.0.0
<li> pynetdicom==1.5.3

All packages can be found in pip

### Files
This service consists of 4 files:

##### pingService.py
Main file with the service, you should not need to edit this file.
 
##### pingServiceConfig.py
Configuration file, you need to update this file 

##### pingServiceTemplate
This file is a template for the service. Modify it and place it in /etc/systemd/system/

##### README.md
The file you're currently reading.

## Installing Ping Service
  Install this service AFTER you've set up the database in TracerShop. 
