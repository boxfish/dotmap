"""
Handlers that inspect, log, and modify
in-transit Orbited messages.

This file is very application specific,
so there needs to be a clear way to:

    1. Create custom message handlers
    2. Overide of message handlers
    3. "Plug in" custom message handlers


"""
import os
import sys
# Environment setup for your Django project files:
sys.path.append("djangoweb")
os.environ['DJANGO_SETTINGS_MODULE'] = 'djangoweb.settings'

from django.conf import settings 
from django.contrib.auth.models import User
from djangoweb.dialogues.models import Dialogue, Message, Response

import urllib, urllib2

try:
  # 2.6 will have a json module in the stdlib
  import json
except ImportError:
  try:
    # simplejson is the thing from which json was derived anyway...
    import simplejson as json
  except ImportError:
    print "No suitable json library found, see INSTALL.txt"

# TODO
# take all below functions and put into an base class and subclass:
# Make 'logging' of all message tunable
# Have base-class use  'getattr' in combination with 'msgtype'.
# to get the appropiate message handler.
def handle_send(msg, username, channel_id):
  msg = json.loads(msg)
  msg.update({"from":username})
  msgtype = msg.get("type")
  if msgtype is None:
    update = {"error":"Missing message type"}
  if msgtype == "chat":
    update = _handle_chat(msg, username, channel_id)
  if msgtype == "select_map_resp":
    update = _handle_select_map_resp(msg, username, channel_id)
  #update the message with type specific response info:
  msg.update(update)
  return msg

def _handle_select_map_resp(msg, username, channel_id):
  update = {"from": username}
  respId = msg.get("respId")
  # get the latest message by the user
  author = User.objects.get(username=username)
  message = Message.objects.filter(author=author).order_by('-created_time')[0]
  response = Response.objects.get(message=message, respId=respId)
  message.selected_respId = respId
  message.save()
  update["response"] = {}
  update["response"]["id"] = respId
  update["response"]["type"] = response.type
  update["response"]["preview"] = response.preview
  update["response"]["explanation"] = response.explanation
  return update
  
def _handle_chat(msg, username, channel_id):
  update = {"from":username}
  content = msg.get("msg")  
  url = settings.DM_URL + "/" + channel_id + "/messages/"
  data = {"speakerId":username, "message": content}
  f = urllib2.urlopen(url, json.dumps(data))
  result = json.loads(f.read())
  f.close()
  author = User.objects.get(username=username)
  dialogue = Dialogue.objects.get(guid=channel_id)
  message = Message(dialogue=dialogue, content=content, author=author)
  
  if type(result) == list:  
    update["status"] = "success"
    # get the pgxml
    url = settings.DM_URL + "/" + channel_id + "/plangraph/"
    f = urllib2.urlopen(url)
    message.pgxml = str(f.read())
    message.save()
    
    update["responses"] = []
    # get the responses
    for resp in result:
      response = Response(message=message, respId=resp["id"], type=resp["type"])
      if resp.has_key("preview"):
        response.preview = resp["preview"]
      if resp.has_key("explanation"):
        response.explanation = resp["explanation"]
      # get the content of the response
      url = settings.DM_URL + "/" + channel_id + "/responses/" + resp["id"]
      f = urllib2.urlopen(url)
      response.content = str(f.read())
      response.save()
      update["responses"].append(resp)    
  elif result.has_key("status") and result["status"] == "error":
    update["status"] = result["status"]
    update["message"] = result["message"]
  return update
  
def handle_subscribe(msg, username, channel_id):
    print "=handle_subscribe= ", msg, username, channel_id
    return msg

def handle_connect(msg, username, channel_id):
    print "=handle_connect= ", msg, username, channel_id
    return msg

def handle_disconnect(msg, username, channel_id):
    print "=handle_disconnect= ", msg, username, channel_id
    return msg

MESSAGE_HANDLERS = {
    "send":handle_send,
    "subscribe":handle_subscribe,
    "connect":handle_connect,
    "disconnect":handle_disconnect
}
