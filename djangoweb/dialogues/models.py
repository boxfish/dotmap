from django.db import models
from django.contrib.auth.models import User

class Dialogue(models.Model):
  """A Dialogue
  `creator`: The User that initiate the dialogue. 
  """
  guid = models.CharField(max_length=50, unique=True) 
  creator = models.ForeignKey(User, related_name="dialogue_created") #User who initated the dialogue
  name = models.CharField(max_length=140) 
  description = models.TextField() 
  created_time = models.DateTimeField(auto_now_add=True)
  participants = models.ManyToManyField(User, related_name="dialogue_participated")
    
class Message(models.Model):
  """docstring for Message"""
  dialogue = models.ForeignKey(Dialogue, related_name="message_included")
  content = models.TextField()
  created_time = models.DateTimeField(auto_now_add=True)
  author = models.ForeignKey(User, related_name="message_authored") #User who created the message
  pgxml = models.TextField()
  mapxml = models.TextField()    