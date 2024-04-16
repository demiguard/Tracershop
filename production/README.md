# Tracershop production
*Last edited 2024-04-16*

This is a [django](https://www.djangoproject.com/)
[ASGI](https://asgi.readthedocs.io/en/latest/specs/main.html) web site with a
[react](https://reactjs.org/) frontend.
It's available at: [Tracershop](https://tracershop.regionh.dk)

It's a one site webpage. It consists of the following files & modules:

##### Modules
- core
- database
- data_scripts
- frontend
- lib
- production
- tests
- TracerAuth
- websocket

##### Files
- clearProductionDatabase.py
- constants.py
- config.py
- manage.py
- run_tests.py
- copydog.py
- generate_derived_javascript
- import_data.py
- importProductionDatabase.py
- pingServiceHL7.py
- shared_constants.py
- vialdog.py


This is a python application with a virtual environment found in the parent
directory and should be activated before running any other command.
> `source ../venv/bin/activate`

Once this is done a test version of the server can be started using:
> `python3 manage.py runserver`

This opens the server locally, to open the server from connections else where
run
> `python3 manage.py runserver 0.0.0.0:8000`

Which allows external computers to access the server.

To sync the django application models and the underlying mysql database run:
> `python3 manage makemigrations`
> `python3 manage migrate`

Note this only creates the tables and constraints, and not the entries in the
database. This can be done using
> `python3 manage shell`
> `>>> from api import models`
> `models.<Model you wish to create>(table values).save()`
To see which models are nessecary check *installation.MD* (yes this doens't exists yet)

To test the application, run the python script:
> `python3 runTests.py`

To generate a coverage report of the python tests run
> `coverage run runTests.py`
> `coverage report -m` or `coverage report -m --skip-covered`

## Core

## Data Scripts

## Database

## Frontend


See [README](production/frontend/README.md) for details

This is react the frontend, meaning it's mostly javascript code, however it also consits of the index endpoint and the static files at: *production/frontend/static/*

The frontend is build using npm and webpack. However these commands must be run from the frontend directory.
> `cd frontend`

To build the react app run:
> `npm run dev`

This makes the compiler watch the frontend directory. To close the compiler again, send it a SIGINT. It compiles a development version, which is unsuited for production.
To make it compile a production build run:
> `npm run build`

There's a handful of tests that can be run with:
> `npm run test`

The configuration for webpack is found at: *production/frontend/webpack.config.js*

### The React Application
A React app is build of composing components. All of the javascript source code can be found in *production/frontend/src* where the entry point is the *App.js*

The app components contains a very large state, this is because, it's a requirement that the state is shared between simultaneous users. So when one user makes a change, the other users should be made aware of that change as fast as possible, such that users doesn't make conflicting changes. For instance if two users becomes aware of the need to make an order for a customer. Then the program should makes an attempt to ensure that the second user can see that the first user already have made the order.
This is achieved by using websockets and keeping a large part of the database in memory, and then synchornizing as nessesary. This is also why websockets are needed, since HTTP is a stateless protocol, meaning that the server needs a method to send data unpromped to the user. Since having the entire database in memory is a bad idea, the tables with large amounts of data have been cut down. These are:
- orders
- t_orders
- VAL
However some full tables are contained in memory:
- TracerCustomer
- Tracers
- Users (Kinda)
- blockDeliverDate (kinda)
- delvierTimes
- isotopes
- productions

To ensure that the page can load without a copy of the state is saved in local memory, using [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) found in *src/lib/localstorageDriver.js*

As described above this a one page site, this means that the user connect to the sites onces and in general doesn't makes additional HTTP requests, with the exception of making requests for resources. While this is goal, some of the code have been shamelessly stolen from the internet. The common use case is to use http protocol over websocket, hence the stolen parts are might be using some ajax ~ aka: HTTP requests.

The site itself doesn't appear one site, and what you normally would considers differnt views can be found in *production/frontend/src/components/ProductionPages*
The different pages can be found in pages directory, and the Pages constant found in *App.js*. This means it should be fairly easy to extend the App with additional pages:
1. Create a new React component
2. Import and add the component to the Pages constant

The pages is then integrated automaticly with a button in the navbar should automaticly be created, that when the user clicks on it, the app displays that page. The viewed page is a part of the App state, meaning that all views have the same props, however they might use them differently or not at all. This is technically a break of encapsulation, but as far as my knowlegde goes it pointers passed around, and therefore shouldn't cause large performance problems.

As there's quite a few promps or modals they have their own folder. Finally if some components are used multiple places, they should be placed under injectables.

Commonly used function, that are not associated with a components or able to be generalized can be found in lib. There's also some common objects for rendering in there.

**TODO**: Much of the react app remains untests, this should be ratified at some point.

## Lib
This is where most library functions are placed. The two major components revovle around the legacy database. So first a little history lesson. Django require SQL 5.7 or greater, and the old tracershop is running on a 5.1 MYSQL database. Django have a pretty nice database abstration in models, that allows the programmer to ignore the existance of the database and "frees" the programmer from writting SQL. This is done by using models, where the class corospons to a table and an instance of a model (often) corospond to an entry of that table. Sadly Due to the matematical fact of 1 < 7, the old database cannot be used a django database and as such much of djangos model interface is unable to represent the old database. The concept of models and instances is useful and desired and is implemented in [Python's dataclasses](https://docs.python.org/3/library/dataclasses.html), to attempt to replicate the functionality of django models.
While it's a replicate, there's a large difference in API, and while they represent the same thing, the way they go about it is very different. These dataclasses are found in *production/lib/ProductionDataClasses*. Each of the tables inherits from `JsonSerilizableDataClass` an abstract class which represents a table and a common inheritance point.

Note however that there's an overlap between the table column keys and the names of the dataclass attributes, which is why there's an overlap between danish and english names. IE it's not my fault and yes it's bad naming practice. It's planned that the old database will be migrated to a newer version of the which will django database, which will retify this.

Similarly to the django the SQL sublibrary hides the SQL from the programmer. Of cause, this is a custom module so some SQL is written. Mainly the SQL code should be generated in the SQLFactory, which is methods that transform python objects into valid SQL queries. The SQLExecuter then executes a query and returns the data to the SQLFormatter. This entire processed is controlled by the SQLController and is the entry point to interact with the legacy database. The full process is described in websocket section.

## Tests
This module provides help the various tests, such as creating a test legacy database, note this doesn't uses the buildin django test method, rather it creates it own database. Note that it also fills the django database with the entries such that, it can query the legacy database. The way tests works is that before the tests are run an additional database is created, then the entries in the django database is created such that the server can query. Then it builds a [unittest](https://docs.python.org/3/library/unittest.html) integrated with djangos framework.

Note that I'm experiencing some bug using the databaseInterface, and i'm using SQLExecuter raw to test for sideeffects.

**Disclaimer**: The following section is me complaining about how the unittest framework works is built, mainly how parameterized test is impossible. In otherwords if you're reading docs because there's a problem this is not the place.

So, unittest is a out of the box class-based framework. Now, Django just built on top of this framework, mostly providing methods to interact with models and creating a clean database when the test suite is run. No problems, everything is danty. The way this works is that you create a class that inherits from `unittest.TestCase`. and fill it with `test_` methods.  Now say that you're a stupid programmer and you make an attribute aka a noncallable object names test_data.  The framework covers you by filtering out properties by checking if a attribute is a method or a property, so the frameworks knows what are tests and what are data that are used by those tests. To create the test suite the framework scan all subdirectory for tests_*.py files and findes all classes that inherits from `unittest.TestCase`. No problems all great, then it creates a test suite. This is done by creating a instance of the TestCase with an associated testcase method or rather **the string matching the test method** that this testcase instance will test.
The test methods cannot have any arguments except `self`. Well kinda, imaging that you have a decorator that provides an argument such a function. Now there's not much of a point, to such a decorator since you could just have specified it a variable in the function.
Before I continue you need to understand what a decorator is. A decorator is a function, that just returns a function. Well kinda, you're free to return whatever you wish, but it kinda needs to return function to return what you want. Now decorators cannot take arguments however if arguments are needed you can create a decorator factory, which is just a function that returns a decorator.
With this out of the way consider the function:
>`def add(x : float,y : float) -> float: return x + y`

Well no biggy, you throw a couple of floats at it hope for the best. Now there's alot of floats and you might come with some good suggestions that might break things aka 0, 1, -1, inf, -inf. but what about a random number such as 386041.48391? Now you could create a case for that number, however there is still missing uncountable many numbers, which means you need uncountable many testcases, which gives a REEEEEEEALLY long file. Well just generate a random number and wrap it in a for loop, then there's only a single testcase. Well, what if there's a bug in the for loop code or random generator? You might consider it be unreasonable to question the validity of the standard library, afterall the feeding decorator also needs to generate a random number, but you introduce small dependency there. Secondly if the test fails for number 3491.58206, then we do not test the rest of the numbers, potentially uncovering more bug in the code.
You could use subtests, however this gets very wierd very quick is a subtest a test? This [article](https://blog.ganssle.io/articles/2020/04/subtests-in-python.html) is some nice fooder for my cognitive bias. So how to solve this? Quick-check is a module for haskell and python, that generates random input for test cases. Now this is where decorator comes back, because we need to be able to feed the function with the randomly generated data.
However, because the testCase class is instances with a string and not a function object, when the decorators are called, they can only return a single function.
THIS COULD HAVE BEEN POSSIBLE IF THE TEST CASES WHERE INSTANCES WITH A FUNCTION OBJECT INSTEAD OF A STRING, LIKE WHY DO YOU NEED TO TURN IT INTO A STRING. YOU HAVE \_\_NAME\_\_ IF YOU WANT THE GOD DAMN FUNCITON NAME

## TracerAuth
This is module that deals with the fact there's two authentication databases to work with, more specificly the legacy database contains old logins. Note that these login should be fased out at some point. However since this module is mostly stolen from the net, it's using http, but really it should be using the websocket. So this module is sorta legacy, however it's unlikely to ever be removed due to containing the User model and django doesn't really like changing the user model.

## WEBSOCKET
The websocket module concerns itself with the communication through the websocket. It's using [channels](https://channels.readthedocs.io/en/stable/) module for this.