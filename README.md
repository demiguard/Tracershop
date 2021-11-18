# Tracershop

This is the source code for tracershop. Troubleshooting and installtion guide.
Tracershop is the bookkeeping system for Rigshospital nuclear cylotrones for tracers for PET and CTs scans.

The bookkeeping system is a django webservice that runs on top of a mysql database. Note that due to the projects complexsity the webservice is connected to another mysql service, due to the fact that it must integrate with an older service.

## Components of Tracershop

* **Django app - Customer** *(UWSGI DJANGO / Pure Javascript + JQuery WEBSERVER)* The main internal webservice for placing orders.
* **pingService** *(System Service)* A service that retrieves internal studies to provide for easy ordering. This is a Customer Subsystem.
* **Production** *(AWSGI DJANGO / REACT WEBSERVER)* This site is the productions view of tracershop, it configures availble tracers and accepts orders.

## Old System & improvements

The System runs a 'copy' of the old database on the new database, this is done so that cutting the cord from the old service is very easy.

Note that the customer number 'kundenummer' from the user table is unused, instead the BID is used for most things. Note that this external Database prevent you from creating stuff like a nice and pretty REST API.

Obviously if you are looking at this and wish to improve upon this system, upgrading and having a look and remaking the database system should be your top priority.

Secondly I would also recommend rewritting the Customer to be a React / Django App. Once you start maintaining both the production and the Customer APP then you'll know the difference. 

### Programmer Notes

  This code base tries to follow the code standard set forward by <https://www.python.org/dev/peps/pep-0008/> with camelcase Note that not all code is this, but It should aim.
  Therefore if you make updates please try and follow this style guide.
  With the following exceptions:
  
* Use 2 spaces instead of 4 for indentation
* Allow multiple spaces after multiple assignments to line them up

Simlarly The javascript should follow the google styleguide found here: <https://google.github.io/styleguide/jsguide.html>.
Note that it was decided 1.5 year into development that this style guide should be followed so there's plenty of errors. The Quick and dirty of it using lowercase CamelCase.
Also this site might be helpful <https://jsdoc.app/index.html>

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


### Notes To self

Here's a list of some the useful tutorials that have helped setting up the production

* <https://medium.com/analytics-vidhya/django-react-integration-37acc304e984>
