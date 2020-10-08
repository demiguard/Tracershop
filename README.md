# Tracershop

This is the source code for tracershop. Troubleshooting and installtion guide.
Tracershop is the bookkeeping system for Rigshospital nuclear cylotrones for tracers for PET and CTs scans.

The bookkeeping system is a django webservice that runs on top of a mysql database. Note that due to the projects complexsity the webservice is connected to another mysql service, due to the fact that it must integrate with an older service.

## Components of Tracershop

* **Django app - Customer** The main webservice
* **pingService** a service that retrieves studies from the future at a regular interval
* **OldFaithful** a service that regulary syncronises the new database and the old database

## Old System

The System runs a 'copy' of the old database on the new database, this is done so that cutting the cord from the old service is very easy.

Note that the customer number 'kundenummer' from the user table is unused, instead the BID is used for most things.

### Difference from the old system

The user group have changed quite a bit, now instead of having a single user, a customer can have multiple users so that a department don't have to share a single profile.

### Equvivalent tables

Note that all new tables (to the right) have a customer_ ommited and that not all attributes are mapped over only those in use

* Old table : New Table
* Users     : Customer

## Installation Process

In general the process will look something like this.

1. Download the git repo from url:
2. Install Mysql and update the django parameters to match the database
3. Fill in relevant tables in the mysql database (inside of tracershop/construct_database there's a couple fo scripts that might be helpful)
4. Install pingService. See pingService/README.md for installation
5. Install SyncoDBService. See SyncoDbService
6. Install UWSGI see tracershop/README.md for guide there

Apologies for any holes in the Documentation
