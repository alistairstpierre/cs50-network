const user_id = JSON.parse(document.getElementById('user_id').textContent);

document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all-posts').addEventListener('click', load_posts);
    document.querySelector('#profile').addEventListener('click', () => load_profile(user_id));
    document.querySelector('#following').addEventListener('click', load_following);

    document.querySelector('#post').addEventListener('click', post_btn_handler);
    document.querySelector('#post-form').addEventListener('submit', post_form_submit_handler);

    // By default, load the inbox
    load_posts();
  });

  function update_paginator(data) {
    if(data.has_previous) {
      document.querySelector('#paginator_prev_page').setAttribute('href', `?page=${data.previous_page}`)
      document.querySelector('#paginator_prev_page').style.display = 'block';
    }
    else {
      document.querySelector('#paginator_prev_page').style.display = 'none';
    }

    document.querySelector('#paginator_current_page').innerHTML = `Page ${data.current_page} of ${data.num_pages }.`

    if(data.has_next) {
      document.querySelector('#paginator_next_page').setAttribute('href', `?page=${data.next_page}`)
      document.querySelector('#paginator_next_page').style.display = 'block';
    }
    else {
      document.querySelector('#paginator_next_page').style.display = 'none';
    }
    
  }

  function load_posts() {
    document.querySelector('#posts-view').style.display = 'block';
    const profile_view = document.querySelector('#profile-view')
    profile_view.innerHTML = ""
    const following_view = document.querySelector('#following-view')
    following_view.innerHTML = ""

    const all_posts = document.querySelector('#posts-content')
    all_posts.innerHTML = ""

    fetch(`/get_posts/0`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
          data.data.forEach(post => {
            all_posts.innerHTML += 
            `
              <div class="border border-secondary rounded p-3 m-2"> 
                <h4><a id="profile_${post.id}" href="#" onClick="load_profile(${post.user_id})">${post.username}</a></h4> 
                <p class="my-1">${post.post}</p> 
                <p class="my-1 text-muted"><small>${post.updated_at}</small></p> 
                <div class="likes">
                  <img src='static/network/heart.png'>
                  <p class="text-muted ml-1 mb-0">${post.likes}</p>
                </div>
              </div>
            `      
          });
          update_paginator(data)
      })
  }

  function load_profile(id) {
    document.querySelector('#posts-view').style.display = 'none';
    const all_posts = document.querySelector('#posts-content')
    all_posts.innerHTML = ""
    const following_view = document.querySelector('#following-view')
    following_view.innerHTML = ""

    const profile_view = document.querySelector('#profile-view')
    profile_view.innerHTML = ""

    console.log('load_profile');
    fetch(`/get_profile/${id}`)
    .then(response => response.json())
    .then(profile => {
      if(!profile.is_user) {
        var follow_btn_text = "Follow"
        if (profile.is_following)
          follow_btn_text = "Unfollow"
        profile_view.innerHTML += 
        `
          <form id="follow-form" onSubmit="follow_form_submit_handler(${id})">
            <input type="submit" class="btn btn-primary follow-btn btn-sm ml-2" id="follow-btn" value="${follow_btn_text}"/>
          </form>
        `
      }
      profile_view.innerHTML += 
          `
              <p class="m-1 ml-2">Followers: ${profile.followers}</p>
              <p id="following-count" class="m-1 ml-2">Following: ${profile.following}</p>
          `
      profile.posts.forEach(post => {
        profile_view.innerHTML += 
        `
          <div class="border border-secondary rounded p-3 m-2"> 
          <h4>${post.username}</h4> 
          <p class="my-1">${post.post}</p> 
          <p class="my-1 text-muted"><small>${post.updated_at}</small></p> 
          <div class="likes">
            <img src='static/network/heart.png'>
            <p class="text-muted ml-1 mb-0">${post.likes}</p>
          </div>
          </div>
        `
      });
    });
  }

  function load_following() {
    const profile_view = document.querySelector('#profile-view')
    profile_view.innerHTML = ""
    document.querySelector('#posts-view').style.display = 'none';
    const all_posts = document.querySelector('#posts-content')
    all_posts.innerHTML = ""
    const following_view = document.querySelector('#following-view')
    following_view.innerHTML = ""

    console.log('load_following');
    fetch(`/get_posts/${user_id}`)
    .then(response => response.json())
    .then(posts => {
        posts.forEach(post => {
          following_view.innerHTML += 
          `
            <div class="border border-secondary rounded p-3 m-2"> 
              <h4><a id="profile_${post.id}" href="#" onClick="load_profile(${post.user_id})">${post.username}</a></h4> 
              <p class="my-1">${post.post}</p> 
              <p class="my-1 text-muted"><small>${post.updated_at}</small></p> 
              <div class="likes">
                <img src='static/network/heart.png'>
                <p class="text-muted ml-1 mb-0">${post.likes}</p>
              </div>
            </div>
          `      
        });
    })
  }

  function post_btn_handler() {
    console.log('post button clicked')
    document.querySelector('#post-form').dispatchEvent(new Event('submit'))
  }

  function post_form_submit_handler() {
    console.log('post form submit')
    fetch('/make_post', {
        method: 'POST',
        body: JSON.stringify({
            post: document.querySelector('#compose-post').value
        })
      })
      .then(load_posts())
  }

  function follow_form_submit_handler(id) {
    console.log('follow form submit')
    fetch(`/follow/${id}`, {
        method: 'POST',
      })
      .then(response => response.json())
      .then(result => {
        document.querySelector('#following-count').innerHTML = `Following: ${result.following_count}`
        document.querySelector('#follow-btn').value = "Follow"
        if(result.is_following)
          document.querySelector('#follow-btn').value = "Unfollow"
      });
  }