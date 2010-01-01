import os
from django.conf.urls.defaults import *
from django.contrib import admin
admin.autodiscover()

from django.conf import settings 

from views import index, proxy


urlpatterns = patterns('',
    (r'^$', index),
    (r'^proxy/', proxy),
    (r'^dialogues/', include('djangoweb.dialogues.urls')),
    (r'^accounts/', include('djangoweb.registration.urls')),
    (r'^admin/(.*)', admin.site.root),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^static/(.*)', 'django.views.static.serve', {'document_root': os.path.join("../", 'static')}),
)

