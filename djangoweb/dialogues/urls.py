from django.conf.urls.defaults import *

from dialogues.views import * 

urlpatterns = patterns('',
    url(r'^new$', new, name='new'),
    url(r'^(?P<guid>.*)/plangraph$', plangraph, name='plangraph'),
    url(r'^(?P<guid>.*)/map$', map, name='map'),
    url(r'^(?P<guid>.*)/join$', join, name='join'),
    url(r'^(?P<guid>.*)/leave$', leave, name='leave'),
    url(r'^(?P<guid>.*)$', dialogue, name='dialogue'),
)

