from django.http import HttpResponseRedirect, Http404
from django.shortcuts import render_to_response
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.conf import settings 
from django.contrib.auth.models import User
from django.http import HttpResponse

from dialogues.models import Dialogue, Message
from dialogues.forms import DialogueForm

from datetime import datetime
from hashlib import md5

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

@login_required
def plangraph(request, guid):
  url = settings.DM_URL + "/" + guid + "/plangraph/"
  f = urllib2.urlopen(url)
  response = f.read()
  f.close()
  return HttpResponse(response, mimetype="text/xml")        

@login_required
def map(request, guid):
  url = settings.DM_URL + "/" + guid + "/map/"
  f = urllib2.urlopen(url)
  response = f.read()
  f.close()
  return HttpResponse(response, mimetype="text/xml")        

@login_required
def join(request, guid):
  try:
    dialogue = Dialogue.objects.get(guid=guid)
  except Dialogue.DoesNotExist:
    raise Http404
  isParticipating = "False"
  try:
    dialogue.participants.get(username__exact=request.user.username)
  except User.DoesNotExist:
    url = settings.DM_URL + "/" + guid + "/participants/"
    data = {"name":request.user.username, "id": request.user.username}
    f = urllib2.urlopen(url, json.dumps(data))
    result = json.loads(f.read())
    f.close()
    if result["status"] == "success":
      dialogue.participants.add(request.user)
      isParticipating = "True"
    else:
      args = {"message":result["message"]}
      return render_to_response('dialogues/error.html', args)
  return HttpResponseRedirect('/dialogues/' + guid)

@login_required
def leave():
  pass

@login_required
def dialogue(request, guid):
  try:
    dialogue = Dialogue.objects.get(guid=guid)
  except Dialogue.DoesNotExist:
    raise Http404
  isParticipating = "True"
  try:
    dialogue.participants.get(username__exact=request.user.username)
  except User.DoesNotExist:
    isParticipating = "False"
  args = {"dialogue":dialogue, "user":request.user, "isParticipating": isParticipating, "PROXY_HOST": settings.PROXY_HOST, "STOMP_PORT":settings.STOMP_PORT, "HOST":settings.INTERFACE, "SESSION_COOKIE_NAME":settings.SESSION_COOKIE_NAME}
  return render_to_response('dialogues/dialogue.html', args)
  
@login_required  
def new(request):
  """
  Create a new dialogue, with 1 initial participant
  """
  if request.method == 'POST':
    dialogue_form = DialogueForm(request.POST)
    if dialogue_form.is_valid() and not hasattr(dialogue_form.errors, "extra"):
      url = settings.DM_URL + "/"
      data = {}
      data["participants"] = [{"name":request.user.username, "id": request.user.username}]
      f = urllib2.urlopen(url, json.dumps(data))
      result = json.loads(f.read())
      f.close()
      if result["status"] == "success":
        dialogue_inst = dialogue_form.save(commit=False)
        dialogue_inst.guid = result["dialogueId"]     
        dialogue_inst.creator = request.user
        try:
          dialogue_inst.save()
          dialogue_inst.participants.add(request.user)
          return HttpResponseRedirect('/dialogues/' + dialogue_inst.guid) # Redirect after POST
        except IntegrityError:
          dialogue_form.errors.extra = "The dialogue already exists."
      else:
        dialogue_form.errors.extra = result["message"]
  else:
    dialogue_form = DialogueForm()
  args = {"dialogue_form":dialogue_form, "user":request.user}
  return render_to_response("dialogues/new.html", args)

