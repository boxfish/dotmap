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
    # get the dialogues that the user has participated
    if request.user.is_authenticated():
        url = settings.DM_URL + "/?user_id=%s" % request.user.username
        f = urllib2.urlopen(url)
        data = f.read()
        dialogue_list = json.loads(data)
        if type(dialogue_list) == list:
            participated_dialogues = Dialogue.objects.filter(guid__in=dialogue_list)
            args["participated_dialogues"] = participated_dialogues
    return render_to_response("index.html", args)

def proxy(request):
  """http proxy for external resources"""
  f = None
  if request.method == "GET":
    url = request.GET["url"]
    f = urllib2.urlopen(url)
  elif request.method == "POST":
    url = request.POST["url"]
    data = urllib.urlencode(request.POST)
    f = urllib2.urlopen(url, data)
  response = f.read()
  content_type = f.info()['Content-Type']
  f.close()
  return HttpResponse(response, content_type=content_type)        