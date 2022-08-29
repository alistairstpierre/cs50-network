from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import datetime

class User(AbstractUser):
    pass

class Post(models.Model):
    post = models.CharField(max_length=2000)
    created_at = models.DateTimeField(default=datetime.now, blank=True)
    updated_at = models.DateTimeField(default=datetime.now, blank=True)
    likes = models.IntegerField(default=0)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user.id,
            "username": self.user.username,
            "post": self.post,
            "created_at": self.created_at.strftime("%b %d %Y, %I:%M %p"),
            "updated_at": self.updated_at.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.likes,
        }

class Follow(models.Model):
    follower_id = models.IntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)

class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

