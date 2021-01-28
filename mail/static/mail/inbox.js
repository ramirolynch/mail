document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener("submit", send);

// By default, load the inbox
  load_mailbox('inbox');

});

// when clicking compose, this function hides the other views and shows the compose-view and also clears out any values
// from the form

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#load-email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

// takes values entered by the user and sends them to the server via the fetch api

function send(event) {
  event.preventDefault();

  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;


  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then((result) => {
    load_mailbox('sent', result);
    })
  .catch((error) => console.log(error));
}

// displays the single email details

function bring_email(data) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#load-email').style.display = 'block';

  // fetch and display email
  fetch(`/emails/${data['id']}`, {

   })
  .then(response => response.json())
  .then(email => {
      document.querySelector('#load-email').innerHTML = `<h3>${email.subject}</h3>`;
      
      const emDiv = document.createElement('div');
      emDiv.setAttribute('class', 'border mt-2');
      emDiv.innerHTML += `From: ${email.sender}<br />`;
      emDiv.innerHTML += `Recipients: ${email.recipients}<br />`;
      emDiv.innerHTML += `Sent on ${email.timestamp}<br />`;

      const bodyD = document.createElement('div');
      bodyD.setAttribute('class', 'border mt-2 mb-2');
      bodyD.innerHTML += `${email.body}<br />`;
      document.querySelector('#load-email').appendChild(emDiv);
      document.querySelector('#load-email').appendChild(bodyD);

      const replyBtn = document.createElement('button'); 
      replyBtn.setAttribute('class', 'btn btn-outline-primary');
      replyBtn.textContent = 'Reply';
      document.querySelector('#load-email').appendChild(replyBtn);

      replyBtn.addEventListener('click', () => {
        
        compose_email(); 
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = email.subject.slice(0,4) == 'Re: ' ? `Re: ${email.subject.slice(4,)}` : `Re: ${email.subject}`;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote ${email.body}`;
      
      }); 
  })

  // makes the emails read 
  fetch(`/emails/${data['id']}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true
    })
  });
}

// creates and displays a div for each email depending on the mailbox

function email_details(data, div, mailbox) {
 
  const content = document.createElement('div');
  const recipients = document.createElement('strong');

  if (mailbox === 'sent') {
    recipients.innerHTML = `${data['recipients']}, `;
  }
  else {
    recipients.innerHTML =`${data['sender']} `;
  }
  
  content.appendChild(recipients);
  content.innerHTML += data['subject'];

  // create date div and  make innerHTLM equal to timestamp
  const date = document.createElement('div');
  date.innerHTML = data['timestamp'];
  date.style.display = 'inline-block';
  date.style.float = 'right';
  data.read ? div.style.backgroundColor = 'grey' : div.style.backgroundColor = 'white';
  data.read ? date.style.color = 'black' : date.className = 'text-muted';


  content.appendChild(date);

  content.style.padding = '12px';
  div.appendChild(content);
  div.setAttribute('class', 'border mt-2');
}

// This function capitalizes the first letter in a string.
const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// this function handles the messages received from Django

function newalert(message) {

  const newdiv = document.createElement("div");

  message["message"] ? newdiv.innerHTML = message["message"] : newdiv.innerHTML = message["error"];
  document.querySelector("#messages").appendChild(newdiv);
}

// this function loads each mailbox

function load_mailbox(mailbox, message="") {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#load-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${capitalize(mailbox)}</h3>`;

   // if there are messages, remove them first
   document.querySelector("#messages").textContent = "";

   // then show any messages 
   if (message !== "") {
     newalert(message);
   }

  // Fetch data from django server
  fetch(`/emails/${mailbox}`)
  .then((response) => response.json())
  .then((emails) => {
    emails.forEach((data) => {
      
      const preview = document.createElement('div'); 
      email_details(data, preview, mailbox);

      preview.addEventListener('click', () => bring_email(data['id']));
      
      document.querySelector('#emails-view').appendChild(preview);

      // add event listener to click and call function bring email

      preview.addEventListener('click', () => bring_email(data));
   
      // end of bring email

          // if mailbox is not sent, add an archive button 
          if (mailbox != 'sent') {
            const archiveButton = document.createElement('button');
            archiveButton.setAttribute('class', 'btn btn-secondary');       
            archiveButton.textContent = data.archived ? 'Unarchive' : 'Archive';
            document.querySelector('#emails-view').appendChild(archiveButton);

            // adds event listener and a function that users the fetch api to toggle the archiveButton
            // then reloads the inbox

            archiveButton.addEventListener('click', () => {
              fetch(`/emails/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    archived: !(data.archived)
                })
              })
            .then(() => load_mailbox('inbox'));
            })
          }
          // end of archive button
    })
  })
}
  
