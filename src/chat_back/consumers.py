import json

from channels.generic.websocket import WebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync

from .models import Message

User = get_user_model()

class ChatConsumer(WebsocketConsumer):

    def fetch_messages(self, data):
        messages = Message.get_last_10_messages()
        content = {
            'command': 'messages',
            'messages': self._messages_to_json(messages)
        }
        self.send_chat_message(content)

    def new_message(self, data):
        author = data['from']
        author_user = User.objects.filter(username=author)[0]
        print(data['message'])
        message = Message.objects.create(
            author=author_user, 
            content=data['message'])
        content = {
            'command': 'new_message',
            'message': self._message_to_json(message)
        }
        return self.send_message(content)

    commands = {
        'fetch_messages': fetch_messages,
        'new_message': new_message,
    }

    def _messages_to_json(self, messages):
        result = []
        for m in messages:
            result.append(self._message_to_json(m))
        return result
    
    def _message_to_json(self, message):
        return {
            'id': message.id,
            'author': message.author.username,
            'content': message.content,
            'timestamp': str(message.timestamp),
        }
        

    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_%s" % self.room_name

        async_to_sync(self.channel_layer.group_add(self.room_group_name, self.channel_name))

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard(self.room_group_name, self.channel_name))

    def receive(self, text_data):
        data = json.loads(text_data)
        self.commands[data['command']](self, data)

    def send_message(self, message):
        async_to_sync(self.channel_layer.group_send(
            self.room_group_name, {"type": "chat_message", "message": message}
        ))

    def send_chat_message(self, message):
        self.send(text_data=json.dumps(message))

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps(message))
        
    
