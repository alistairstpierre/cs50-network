const user_id = JSON.parse(document.getElementById('user_id').textContent);

document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all-posts').addEventListener('click', () => load_posts(1));
    document.querySelector('#profile').addEventListener('click', () => load_profile(user_id));
    document.querySelector('#following').addEventListener('click', load_following);

    document.querySelector('#post').addEventListener('click', post_btn_handler);
    document.querySelector('#post-form').addEventListener('submit', (event) => post_form_submit_handler);

    // By default, load the all posts page TODO
    load_posts(1);
  });

  function update_paginator(data) {
    prev_page_display = data.has_previous ? 'block' : 'none';
    next_page_display = data.has_next ? 'block' : 'none' ;

    document.querySelector('#pagination_container').innerHTML = 
    `    
      <ul class="pagination">
        <li class="page-item"><a class="page-link" href="#" onClick="load_posts(${data.previous_page})" style="display:${prev_page_display};">Previous</a></li>
        <li class="page-item active"><a class="page-link">Page ${data.current_page } of ${ data.num_pages }.</a></li>
        <li class="page-item"><a class="page-link" href="#" onClick="load_posts(${data.next_page})" style="display:${next_page_display};">Next</a></li>
      </ul>
    `
  }

  function load_posts(page_no) {
    document.querySelector('#posts-view').style.display = 'block';
    const profile_view = document.querySelector('#profile-view')
    profile_view.innerHTML = ""
    const following_view = document.querySelector('#following-view')
    following_view.innerHTML = ""

    const all_posts = document.querySelector('#posts-content')
    all_posts.innerHTML = ""

    fetch(`/get_posts/0?page=${page_no}`)
      .then(response => response.json())
      .then(data => {
          data.data.forEach(post => {
            edit_style = post.user_id == user_id ? 'block' : 'none'
            heart = post.liked ? 'static/network/heart.png' : 'static/network/empty_heart.png'
            all_posts.innerHTML += 
            `
              <div id="post_parent_${post.id}" class="border border-secondary rounded p-3 m-2"> 
                <h4><a id="profile_${post.id}" href="#" onClick="load_profile(${post.user_id});">${post.username}</a></h4> 
                <a id="edit_${post.id}" href="#" onClick="edit_post(${post.id}, ${post.user_id});" style="display:${edit_style}">Edit</a>
                <div id="post_container_${post.id}">
                  <p id="post_${post.id}" class="my-1">${post.post}</p> 
                </div>
                <p id="time_${post.id}" class="my-1 text-muted"><small>${post.updated_at}</small></p> 
                <div class="likes">
                  <img id="post_heart_${post.id}" src="${heart}" onClick="liked(${post.id})">
                  <p id="post_likes_${post.id}" class="text-muted ml-1 mb-0">${post.likes}</p>
                </div>
              </div>
            `      
          });
          update_paginator(data)
      })
  }

  function liked(id) {
    fetch(`/like/${id}`, {
      method: 'POST',
    })
    .then(response => response.json())
    .then(result => {
      if(result.error)
        console.log(result.error)
      else {
        heart = result.is_liked ? 'static/network/heart.png' : 'static/network/empty_heart.png'
        document.querySelector(`#post_likes_${id}`).innerHTML = `${result.num_liked}`
        document.querySelector(`#post_heart_${id}`).setAttribute('src', heart)
      }
    });
  }

  function edit_post(id, user) {
    if(user == user_id){
      document.querySelector(`#post_${id}`).style.display = 'none';
      document.querySelector(`#edit_${id}`).style.display = 'none';
      document.querySelector(`#post_container_${id}`).innerHTML += 
      `
        <form id="edit-form-${id}" onSubmit="edit_form_submit_handler(event, ${id});">
          <input type="submit" class="btn btn-primary follow-btn btn-sm" id="edit-submit-btn" value="Save"/>
        </form>
        <textarea id="post-textarea-${id}" name="post" form="edit-form-${id}" rows="3" cols="50"></textarea>
      `
    }
  }

  function edit_form_submit_handler(e, id) {
    e.preventDefault()

    fetch('/edit_post', {
      method: 'POST',
      body: JSON.stringify({
          id: id,
          post: document.querySelector(`#post-textarea-${id}`).value
      })
    })
    .then(response => response.json())
    .then(data => reset_post(data.new_post))
  }

  function reset_post(post) {
    document.querySelector(`#post_${post.id}`).style.display = 'block';
    document.querySelector(`#edit_${post.id}`).style.display = 'block';
    document.querySelector(`#post_container_${post.id}`).innerHTML = `<p id="post_${post.id}" class="my-1">${post.post}</p>`
    document.querySelector(`#time_${post.id}`).innerHTML = `<small>${post.updated_at}</small>`
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

  function post_form_submit_handler(e) {
    e.preventDefault()

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