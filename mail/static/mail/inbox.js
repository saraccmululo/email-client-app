
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener('submit', sendEmail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  //Set title for new email
  document.querySelector('#compose-title').textContent = 'New Email';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //loading the list of emails for that mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // loop through each email and display as a div:
    emails.forEach(email => {
      const eachEmail = document.createElement('div');
      eachEmail.id=`email-${email.id}`;
      eachEmail.className="list-group-item email-item";
      if (email.read) eachEmail.classList.add("read");
      eachEmail.addEventListener("click", ()=> viewEmail(email, mailbox));
      eachEmail.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
       <div><strong>${email.sender}</strong></div>
        <div>${email.subject}</div>
        <small>${email.timestamp}</small>
      </div>`
      document.querySelector('#emails-view').append(eachEmail);
    }); 
  });
}

const sendEmail = (e)=>{
  e.preventDefault();
  //getting data from the form
  const recipients= document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  //sending data to backend via api
  fetch('/emails', {
  method: 'POST',
  body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
     if(result.error) {
      alert(result.error);
      return;
     } 
    load_mailbox('sent');
  });
}

const viewEmail = (email, mailbox) => {
  //Update email as read in the db
  fetch(`emails/${email.id}`, {
    method: "PUT",
    body: JSON.stringify({read:true})
  });
  
  //Update email as read in the UI:
  const emailDiv = document.querySelector(`#email-${email.id}`);
  if (emailDiv) emailDiv.classList.add("read");

  //hide mailbox and compose view
  document.querySelector("#emails-view").style.display='none';
  document.querySelector('#compose-view').style.display = 'none';

  const emailView=document.querySelector("#email-view");
  emailView.style.display = 'block';
  
  //Archive button text
  let archiveBtnTxt;
  email.archived? archiveBtnTxt='Unarchive' : archiveBtnTxt='Archive';

  //Show email details
  emailView.innerHTML= `
  <button id="back-btn" class="btn btn-sm btn-link mb-3">←Back</button>
  <h3>${email.subject}</h3>
  <p><strong>From:</strong>${email.sender}</p>
  <p><strong>To:</strong>${email.recipients}</p>
  <p><strong>Date:</strong>${email.timestamp}</p>
  <hr>
  <p>${email.body}</p>
  
  <button id="reply" class="btn btn-sm btn-info mt-3">Reply</button>
    
  <button id="archiveToggle" class="btn btn-sm btn-outline-primary mt-3">${archiveBtnTxt}</button>`

  //Back button
  document.querySelector("#back-btn").addEventListener("click",()=> {
    document.querySelector("#email-view").style.display="none";
    document.querySelector("#emails-view").style.display="block";
  })
  
 //Archive button functionality
 const archiveBtn=document.querySelector("#archiveToggle")
 if(archiveBtn) {
  //hiding archive button in sent mailbox
  if (mailbox ==='sent'){
    archiveBtn.style.display='none';
  } else {
    archiveBtn.addEventListener("click", ()=>{
    fetch(`emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({archived: !email.archived})
    })
    .then(()=>{
      load_mailbox('inbox');
    })
  })
  }
 }
 
    
 //Reply button functionality:
 document.querySelector("#reply").addEventListener("click", ()=>replyEmail(email))
};


const replyEmail = (email) => {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  
  document.querySelector('#compose-title').textContent = 'Reply';

  //populating input field with email data
  document.querySelector("#compose-recipients").value=email.sender;

  let subject=email.subject
  if (!email.subject.startsWith('Re:')){
    subject= `Re: ${email.subject}`
  }
  document.querySelector("#compose-subject").value=subject;

  document.querySelector("#compose-body").value=`On ${email.timestamp} ${email.sender} wrote:\n${email.body}`;

}
