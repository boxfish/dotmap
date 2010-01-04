from dialogues.models import Dialogue, Message, Response
from django.contrib import admin

class DialogueAdmin(admin.ModelAdmin):
    list_display = ('guid', 'name', 'description', 'created_time', 'creator')
admin.site.register(Dialogue, DialogueAdmin)

class MessageAdmin(admin.ModelAdmin):
    list_display = ('dialogue', 'content', 'created_time', 'author')
admin.site.register(Message, MessageAdmin)

class ResponseAdmin(admin.ModelAdmin):
    list_display = ('message', 'respId', 'type', 'preview')
admin.site.register(Response, ResponseAdmin)