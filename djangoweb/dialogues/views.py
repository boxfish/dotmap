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
  content_type = f.info()['Content-Type']
  f.close()
  return HttpResponse(response, content_type=content_type)        

@login_required
def messages(request, guid):
  url = settings.DM_URL + "/" + guid + "/messages/"
  f = urllib2.urlopen(url)
  response = f.read()
  content_type = f.info()['Content-Type']
  f.close()
  return HttpResponse(response, content_type=content_type)        

@login_required
def responses(request, guid):
  url = settings.DM_URL + "/" + guid + "/responses/"
  f = urllib2.urlopen(url)
  result = json.loads(f.read())
  content_type = f.info()['Content-Type']
  f.close()
  response = None
  if type(result) == list:  
    response = []
    if settings.MODE == "0":
      response = result
    elif settings.MODE == "1":
      # only the selected response will be added
      dlg = Dialogue.objects.get(guid=guid)
      latest_msg = dlg.message_included.order_by('-created_time')[0]
      print latest_msg
      for resp in result:
        print latest_msg.selected_respId
        if latest_msg.selected_respId and latest_msg.selected_respId == str(resp["id"]):
          response.append(resp)    
  elif result.has_key("status") and result["status"] == "error":
    response = {}
    response["status"] = result["status"]
    response["message"] = result["message"]
  return HttpResponse(json.dumps(response), content_type=content_type)        

@login_required
def response(request, guid, responderId):
  if int(responderId) < 0:
    print "TESTTEST"
    dlg = Dialogue.objects.get(guid=guid)
    msg = dlg.message_included.order_by('-created_time')[-int(responderId):-int(responderId)+1][0]

    response = msg.responses_generated.get(respId=msg.selected_respId).content
  else:
    url = settings.DM_URL + "/" + guid + "/responses/" + responderId + "/"
    f = urllib2.urlopen(url)
    response = f.read()
    content_type = f.info()['Content-Type']
    f.close()
  return HttpResponse(response, content_type='text/xml')        

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
  args = {"dialogue":dialogue, "user":request.user, "isParticipating": isParticipating, "PROXY_HOST": settings.PROXY_HOST, "MODE": settings.MODE, "STOMP_PORT":settings.STOMP_PORT, "HOST":settings.INTERFACE, "SESSION_COOKIE_NAME":settings.SESSION_COOKIE_NAME}
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

@login_required
def maplist(request, guid):
  url = settings.DM_URL + "/" + guid + "/responses/"
  f = urllib2.urlopen(url)
  responses = json.loads(f.read())
  f.close()
  maplist = []
  if type(responses) == list:
    for response in responses:
      if response["type"] == "map":
        maplist.append(response)
  """show the maplist slideshow"""
  args = {"maplist":maplist}
  return render_to_response('dialogues/maplist.html', args)
  