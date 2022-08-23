document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#all-posts').addEventListener('click', load_posts);
    document.querySelector('#profile').addEventListener('click', load_profile);
    document.querySelector('#following').addEventListener('click', load_following);

    document.querySelector('#post').addEventListener('click', post_btn_handler);
    document.querySelector('#post-form').addEventListener('submit', post_form_submit_handler);

    // By default, load the inbox
    load_posts();
  });

  function load_posts() {
    const all_posts = document.querySelector('#all-posts')
    fetch('/posts')
      .then(response => response.json())
      .then(emails => {
          emails.forEach(email => {
            if(email.read == false)
              emailView.innerHTML += `<div class="border border-secondary rounded p-3 my-1 email bg-secondary text-light" id="temp"> <p>${email.sender}</p> <p>${email.subject}</p> <p>${email.timestamp}</p></div>`
            else
              emailView.innerHTML += `<div class="border border-secondary rounded p-3 my-1 email bg-white" id="temp"> <p>${email.sender}</p> <p>${email.subject}</p> <p>${email.timestamp}</p></div>`
            var element = document.getElementById("temp");
            element.id = email.id
          });
      });
  }

  function post_btn_handler() {
    document.querySelector('#post-form').dispatchEvent(new Event('submit'))
  }

  function post_form_submit_handler() {
    fetch('/post', {
        method: 'POST',
        body: JSON.stringify({
            post: document.querySelector('#compose-post').value
        })
      })
      .then(load_posts())
  }

  function load_profile() {
    console.log('load_profile');
  }

  function load_following() {
    console.log('load_following');
  }