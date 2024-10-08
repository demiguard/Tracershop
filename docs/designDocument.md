# Design Document

## Introduction

This document describes much of software engineering that have gone into
Tracershop. It assumes the reader experienced in software engineering and some
familiar with Tracershop.

Bracket cursive text such as *[bla bla bla]* is bad design that I may have done
something to and therefore no longer applies.

Before you start reading this. I am opinionated man, that isn't paid enough to
keep a professional tone, therefore expect jokes and other stupid comments to
litter in this document.

## Components Overview

The up-to-date components are found in the production site.

### The main website

This is a Django, Channels ASGI backend service. The site is developed as one
site react app, which uses a websocket for most of its communication.

* `production/settings.py` - Django Settings for the site
* `frontend/views.py` - The entry point for the website
* `frontend/consumer.py` - The entry point for the consumer

The system is deployed with a Httpd frontend, which serves static files and
filters out packages that doesn't come from CIMT's F5 WAF solution. Requests
from F5 also comes with 2 extra HTTP headers flags:

* `X-Tracer-User` - This is the BAM id of the user
* `X-Tracer-Role` - This is the role of the user

There's 6 different user groups, 5 of which is mapped to a AD group, while the
Sixth indicate that the user is doesn't have a ADFS user, and therefore is an
external user. The user groups are:

* `RGH-B-SE Tracershop Site-Admin` - 1
* `RGH-B-SE Tracershop Production-Admin` - 2
* `RGH-B-SE Tracershop Production-User` - 3
* `RGH-B-SE Tracershop Shop-Admin` - 4
* `RGH-B-SE Tracershop Shop-User` - 5
* `"Shop-External"` - 6

Design and code will be discussed later.

### MariaDB

Django comes naturally with a ORM to multiple databases. Here it's a preference
from CIMT side, that we use MariaDB, so that is the logic behind that choice.

Note that CIMT places the socket at `/data.madb/p3306/mysql3306.sock` meaning
that you have add `--socket /data.madb/p3306/mysql3306.sock` to any `mariadb`
calls.

Note that I have made a django app called database, which contains the entire
database. This is mainly because the database is contains high level of
coupling.

### Redis Database

The Redis acts as communication channel *(Hence Channels in django channels)*
which is used for websockets. The main reason why Tracershop is using
websockets is because I wish to use an event based system rather than a timing
based system. This is because in the past there have been issue with messages,
that wasn't idempotent. The solution to this was not only to provide instant
updates but also to make messages idempotent.

Either way, the way that daphne scales is connecting to a redis database, where
it subscribes to a group:`https://redis.io/docs/manual/keyspace-notifications/`

*[Now tracershop doesn't scale because everybody subscribes to a single group.*
*I have begun to create a couple of user groups and production groups, but*
*this work is not done]*

This also allows other programs to trigger websocket messages such as booking
updates or additional new vials.

### Vials

### PingService

### Legacy Components

####

## Code Design

So to start out, some "best" practices:
`https://django-best-practices.readthedocs.io/en/latest/index.html` and
`https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/`

I state this because best practices are options and standards, and I didn't
start by reading them, and therefore there are plenty of deviation from the
these standards.

First things first. What is a web app anyways? It is mostly just a controlled
database viewer and inserter. In other words 99% of what all web service does is get a
request, do some querying at databases, then some formatting and return the
response. This service is no different.

So the first major deviation from best practices concept of small loose coupled
django apps. You cannot separate tracershop into multiple web apps. It is a
webshop, so best practices would dictate a single app, however I have split the
app into multiple django apps that each take care of a part of the application.
These apps are highly coupled. Either way History time why have this mess:

Initially there was two apps, a customer and a production, however the customer
app was written using JQuery, and as a standard WSGI python app. I don't know
if you know what it's like supporting JQuery, then let me tell you:

**Quella è una polpetta piccante 🤌**

At the time I was studying and somebody presented me for React, and I was like
OMG this solves all my problems, so a new django project was made with React in
mind. This made sense because at this point in time it was my belief that this
web service would running on two different servers.

This was because it was at that time running on multiple servers with plenty of
spaghetti, code made by a guy that worked here 2 years ago, that never wrote a
line a documentation (The last one isn't true, but I have a stereotype to
uphold) either way it was a mess, and cleaning up seamed hard. Look I made a
freaking ORM because django's ORM couldn't be installed due to the fact that
the database base was so old interop with it.

Either way, due to the fact that our IT department was so slow at providing
a server, I was like fuck it, I am forced to support it, and I do not want to
deal stupid amounts of legacy code. So I decided to do a grand rewrite, where
I would merge the two site into the newer site. I would simplify the database
to a single database, a single page, a single websocket.

The idea was to use AD user groups to divide things and to stream line things
as much as possible. Note also that at this point in time I was annoyed at the
Django best practice of "small loose couple" due to the fact. This was the
third app, where it had not been possible. (And I am annoyed)

The reason is that separating functionally, concern and other good stuff is
good design, but much easier said that done. When you have a single App, then
you just end up adding a app name to all your imports, witch felt stupid.

Now I had heard stories about how you have your navbar to be one Django app,
and a side bar be another. Well this becomes difficult, whenever you have
shared object. Should they be linked to one app or another?

So I was left with 3 options, 1 create a monolith app again, create a bowl of
the finest spaghetti or create a mixture of highly connected "apps" each with
concerns itself with one functionality. I went with option 3.

Therefore I have following "Apps:"

* core - This is inspired by core library of django, it contains exceptions
shared by all apps. Now I also a have "Lib" app, now there's probably a utils
rant in here somewhere that you should read.
* database - This app contains all database models and functionality of
manipulating the database (`database_interface.py`) This file also acts a async
to sync converter, as you can't access the database async.
* frontend - This app is responsible for the standard web service part. It is
the react app and a few views.
* Lib - Random stuff.
* tests - So instead of having test spread among different apps, tests are in
one "App". This was really just a bunch of legacy from the time where was two
databases and a lot more footwork was required to run unit tests. Namely
creating a secondary database filling it with tables. (Ahh, yes the good old
days... *[The days were not good]*)
* tracerauth - This app is responsible for authentication, validation and other
security related stuff
* websocket - This is django app responsible for all websocket stuff.

### React setup

The largest sub component is the frontend, which is a react app. The Entry
point is `production/frontend/src/index.js` which just imports the app from
`production/frontend/src/components/app.js` and then it goes from there.

Javascript files, from now on, are in found in `production/frontend/src` folder.

React best practices are like asking a group toddler for the type best of candy
in entire the world. You get a lot screaming and not too much information
relevant to your question.

One thing, that the `Https://React.dev` advocates is a low amount of usage of
the `useEffect` hook. The usage of `useEffect` hook should be used as a last
resort. This is because it can trigger a stupid amount of rerenders, because of
their async nature. A page with a useEffect have the following render cycle:
`Initial Render -> UseEffect Render`. The first problem is that in that initial
render, whatever the effect does have not been done.
The real problem if that your effect is triggered by a state change and has its
own state change, then the render chain looks like this:
`State change Render -> UseEffect Render -> State`

Global state is handled by a `TracershopState` found in:
`lib/dataclasses/dataclasses.js` which is a limited database view and is
generated by `generate_derived_javascript.py` in the `production` folder. This
script synchronizes the backend and frontend. If you need to add a constant
that both the front and backend needs to read you should put that into
`shared_constants.py` also found in the `production` folder.

The state is wrapped inside of a context, can be accessed by hook:
`useTracershopState` found in `tracershop_shop_context.js` Note that from the
sites point of view, this state is read only. The only updates to this state
should come from any websocket messages.

The websocket can be accessed by `useWebsocket` hook also found in the same
file. Which provides a websocket wrapper `TracerWebSocket` found in
`lib/tracer_websocket.js`. There should be a method for type of message that is
being send. Note that standard REST messages should be handled by the methods:
`sendCreateModel`, `sendEditModel`, `sendDeleteModel` and there is no get
method because, that's just the state.

So the use of the `send` method outside of the class should be seen as
deprecated. It is the websocket responsibility to update the state if that was
a side side effect from the message. If a component need the message response,
then that's available from the promise that all message producing methods
produce.

In general each message contains a message type, message id, javascript version
where the message id and javascript is set by the websocket. Each response
contains a success value to indicate, if the operation was successful or not.
Note that success in this indicate if the message was handled successful or
triggered an exception.

This project takes the stand that exceptions should be exceptional, and
operations that have a common fail path, should not be exceptional such as
logins. Something exception could be that the user tries to create an object,
which points to a non existent object. Exceptions should be unrecoverable.

Tracershop is not fully in control over incoming data, and therefore these
states could occur.

In the case where there's an error the success value shall be error and there
will be an object with an error type value, to describe the type of error.

It is the individual components responsibility to handle the error.

The TracershopState is just a collection of maps, where you have know how the
data is related. Sometimes it is very obvious, others there's some complicated
groupings, these groups could be made into a javascript class inside of:
`lib/data_structures.js`
