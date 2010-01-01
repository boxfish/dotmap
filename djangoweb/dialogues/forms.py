from django.forms import ModelForm

from dialogues.models import Dialogue


class DialogueForm(ModelForm):
    class Meta:
        model = Dialogue
        fields = ["name", "description"]