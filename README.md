# Tracershop

Tracershop is a bookkeeping, and web shop for radioactive tracers and is therefore to some extend affected by GMP. It's used by the danish Rigshospitalet's cyclotron unit and various hospitals around the capital. Tracershop is build on top of a zope app also named tracershop. This program will be referred to as "Old Tracershop". This project was developed in 2004 and maintained through to 2012.

The new tracershop is designed to be able to run in parallel with the old system, using a common MySQL database. The development of tracershop have taken years, and the skill set of the programmer have improved, which have lead to inconsistent programming style, and many stupid design decisions.

The system is heavily integrated with the hospitals IT system, and therefore has limited usage outside.

## Components of Tracershop

Tracershop like most other web services isn't just a single program, but rather an eco system of programs. Below is a list of program and the machines that they're running on.

* **Old Tracershop** - The old system and database host.
  * Zope 2
  * MySQL 5.1 - Database
  * Script for fetching dispersions of radioactive tracer.
* **Django app - Customer** *(UWSGI DJANGO / Pure Javascript + JQuery WEB SERVER)* The main internal web service for placing orders.
  * HTTP client -> Nginx -> emperor(uWSGI) -> Django web server - Dataflow.
  * MySQL 5.7 - User database, with booking
  * AutoSSH - Tunnel to old tracershop mysql database
* **pingService** *(System Service)* A service that retrieves internal studies to provide for easy ordering in the customer module. This is a Customer Subsystem. Should be though of as a crontab process.
* **Production** *(AWSGI DJANGO / REACT WEBSERVER)* This site is the productions view of tracershop, it configures available tracers and accepts orders.
  * Http client -> Apache (reverse proxy) -> Supervisor -> Daphne -> Channels (Django) App
  * MySQL 5.7 - User database
  * Redis - Database used by websockets.
  * AutoSSH - Tunnel to old tracershop mysql database

## Goal

As seen above, the tech stack is rather complicated, and a simplification is desired. The desired system can be seen in:

[Tech stack picture!](docs/LatexReports/figures/TracershopSystemOverview.png)

Most notable it merges the different web services into a single service. This is to reduce data replication, and to create a single entry point similar to the old tracershop system, which all types of users used.

A major difference between the old system and the new system. Is a desire to run 2 database. A "record" database and a "web server" database.

* **Record database** - Contains all orders, customers, bookings and tracers.
* **Web server database** - Contains all users, IP of different services, session and other django overhead.

## Style Guide

Standard <https://www.python.org/dev/peps/pep-0008/>

Note that Channels are not properly type hinted, but code should be type hinted.

* camelCase in general, PascalCase for classes.
* Use 2 spaces
* No trailing spaces!

With the following exceptions:

* Allowing multiple spaces after multiple assignments to line them up
* No trailing spaces!

The javascript code should follow the google styleguide found here: <https://google.github.io/styleguide/jsguide.html>.

With the following extra rules:

* Always include curly brakes for for-loops and if-statements.

### Terminologies

Belows is a list words that is used throught the Documentation and this is the meaning

* **Ghost Order** A ghost order is an artificalial order created by tracershop when the production moves an order to another timeslot without a host Order.
* **Dead Order** A dead order is an order that doesn't contain ordered activity or deliever activity

## References & Attributes

Icons are made by in documentation are made by <https://www.flaticon.com/authors/freepik> & <https://www.flaticon.com/authors/kiranshastry>
