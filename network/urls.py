
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

        # API Routes
    path("make_post", views.make_post, name="make_post"),
    path("get_profile/<int:id>", views.get_profile, name="get_profile"),
    path("get_posts/<int:id>", views.get_posts, name="get_posts"),
    path("follow/<int:id>", views.follow, name="follow"),
]
