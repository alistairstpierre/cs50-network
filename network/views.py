import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.utils import timezone

from .models import Follow, User, Post, Like


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
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

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
def edit_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Get post data
    data = json.loads(request.body)
    id = data.get("id", "")
    post = data.get("post", "")

    print(f'{request.user} {id} {post}')

    # Get, update, and save post

    old_post = Post.objects.get(id=id)

    if request.user.id != old_post.user_id:
        pass

    old_post.post = post
    old_post.updated_at = timezone.now()
    old_post.save()
    old_post = old_post.serialize()

    return JsonResponse({"new_post":old_post}, safe=False)
    


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


@csrf_exempt
@login_required
def like(request, id):
    # Composing a new post must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    current_user = request.user
    requested_post = Post.objects.get(id=id)

    if requested_post.user.id == current_user.id:
        return JsonResponse({'error':'"error, users cannot like their own post"'}, safe=False)

    liked = Like.objects.filter(post=requested_post.id, user=current_user.id).exists()
    if liked:
        print(f"{current_user.username} no longer likes post {requested_post.id}")
        Like.objects.filter(post=requested_post.id, user=current_user.id).delete()
        post = Post.objects.filter(id=requested_post.id)[0]
        likes = post.likes - 1
        if likes < 0:
            print("error, likes can't go below 0")
        else:
            post.likes = likes
            post.save()
        
    else:
        print(f"{current_user.username} likes post {requested_post.id}")
        entry = Like(
            post = requested_post, 
            user = current_user
        )
        entry.save()
        post = Post.objects.filter(id=requested_post.id)[0]
        post.likes += 1
        post.save()

    is_liked = not liked
    num_liked = Post.objects.filter(id=requested_post.id)[0].likes

    r = {
        "is_liked": is_liked,
        "num_liked" : num_liked
    }
    return JsonResponse(r, safe=False)


def get_posts(request, id):
    if(id == 0):
        posts = Post.objects.all()
    else: 
        following = Follow.objects.filter(follower_id=id)
        users = [user.user.id for user in following]
        posts = Post.objects.filter(user__in=users)

    posts = posts.order_by("-updated_at").all()
    posts = [post.serialize() for post in posts]

    for post in posts:
        like = Like.objects.filter(post=post.get('id'), user=request.user.id).exists()
        post['liked'] = False
        if(like):
            post['liked'] = True

    page = request.GET.get('page', 1)

    paginator = Paginator(posts, 10)
    try:
        objects = paginator.page(page)
    except PageNotAnInteger:
        objects = paginator.page(1)
    except EmptyPage:
        objects = paginator.page(paginator.num_pages)

    data = {
        'has_previous': objects.has_previous(),
        'has_next': objects.has_next(),
        'previous_page': objects.has_previous() and objects.previous_page_number() or None,
        'next_page': objects.has_next() and objects.next_page_number() or None,
        'current_page': objects.number,
        'num_pages': objects.paginator.num_pages,
        'data': list(objects)
    }

    return JsonResponse(data, safe=False)


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
