import profile
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json

from .models import Follow, User, Post


def index(request):
    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "network/index.html")

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_exempt
@login_required
def follow(request, id):
    print("follow")
    current_user = request.user
    print(f"current user: {current_user.username}")
    requested_user = current_user if id == -1 else User.objects.get(id=id)
    is_following = Follow.objects.filter(user=requested_user, follower_id=current_user.id).exists()
    if is_following:
        print(f"{current_user.username} is not longer following {requested_user.username}")
        Follow.objects.filter(user=requested_user, follower_id=current_user.id)[0].delete()
    else:
        print(f"{current_user.username} is now following {requested_user.username}")
        entry = Follow(
            follower_id = current_user.id, 
            user = requested_user
        )
        entry.save()
    is_following = not is_following
    num_following = Follow.objects.filter(follower_id=current_user.id).count()

    r = {
        "following_count": num_following,
        "is_following" : is_following
    }
    return JsonResponse(r, safe=False)


@csrf_exempt
@login_required
def get_profile(request, id):
    print("get profile")
    current_user = request.user
    requested_user = User.objects.get(id=id)
    num_followers = Follow.objects.filter(follower_id=requested_user.id).count()
    num_following = Follow.objects.filter(user=requested_user).count()
    posts = Post.objects.filter(user=requested_user)
    posts = posts.order_by("-updated_at").all()
    posts = [post.serialize() for post in posts]
    is_user = True if current_user.id == requested_user.id else False
    is_following = False
    if is_user == False:
        is_following = Follow.objects.filter(user=requested_user, follower_id=current_user.id).exists()
    profile = {
        "followers": num_followers,
        "following": num_following,
        "posts": posts,
        "is_user": is_user,
        "is_following": is_following
    }
    
    return JsonResponse(profile, safe=False)


@csrf_exempt
@login_required
def make_post(request):
    # Composing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get post data
    data = json.loads(request.body)
    post = data.get("post", "")

    print(f'{request.user} {post}')

    # Create and save post
    entry = Post(
        user=User.objects.get(username=request.user.username),
        post=post
    )
    entry.save()

    return JsonResponse({"message": "Email sent successfully."}, status=201)


def get_posts(request, id):
    if(id == 0):
        posts = Post.objects.all()
    else: 
        following = Follow.objects.filter(follower_id=id)
        users = [user.user.id for user in following]
        posts = Post.objects.filter(user__in=users)
    # else:
    #     return JsonResponse({"error": "Invalid mailbox."}, status=400)

    # Return emails in reverse chronologial order
    posts = posts.order_by("-updated_at").all()
    return JsonResponse([post.serialize() for post in posts], safe=False)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
