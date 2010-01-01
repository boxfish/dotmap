from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.conf import settings 
from django.http import HttpResponse

from dialogues.models import Dialogue

import urllib, urllib2

try:
    # 2.6 will have a json module in the stdlib
    import json
except ImportError:
    try:
        # simplejson is the thing from which json was derived anyway...
        import simplejson as json
    except ImportError:
        print "No suitable json library found"

def index(request):
    # get the current dialogue ids from the dialogue manager serivce
    url = settings.DM_URL + "/"
    f = urllib2.urlopen(url)
    data = f.read()
    dialogue_list = json.loads(data)
    current_dialogues = Dialogue.objects.filter(guid__in=dialogue_list)
    args = {"current_dialogues":current_dialogues, "user":request.user}
    return render_to_response("index.html", args)

def proxy(request):
  """http proxy for external resources"""
  if request.method == "GET":
    url = request.GET["url"]
    return HttpResponse(urllib2.urlopen(url).read())
  elif request.method == "POST":
    url = request.POST["url"]
    data = urllib.urlencode(request.POST)
    return HttpResponse(urllib2.urlopen(url, data).read())
