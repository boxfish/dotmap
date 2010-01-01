dotMap - Realtime mapping using Django + Orbited + Twisted
=========================================================

The experimental web application for testing plangraph-based dialogue management system based on Hotdot (http://github.com/clemesha/hotdot).

Dependencies
---------------------------------------
- Django: Excellent web framework for creating the backbone of a great web application.
- Orbited: Realtime web (Comet) library to build the realtime components with.
- Twisted: Scalable asynchronous network lib, for serving Orbited (and Django too, with WSGI!)
- Overhearer: web service using DMLib

Install & Usage
-------
#. install ``pip``::

    easy_install pip

#. Install dependencies::
    
    #You must have Django 1.0+ and Twisted 9.0+
    
    pip install django orbited twisted simplejson

#. In the directory ``dotmap/djangoweb``, type::

    django-admin.py syncdb --pythonpath='.' --settings='settings'

#. In the toplevel directory ``dotmap``, type::

    twistd -ny server.py 

- Now open browser to http://localhost:8000/
- Also see config options in `server.py`.


Details of how `dotMap` works
-----------------------------
- Orbited as a Twisted Service
- Django running from twisted.web.wsgi
- Authentication using Twisted Cred+Django models
- Filtering + modification + logging of in-transit Orbited messages
- STOMP as the default, example protocol.
