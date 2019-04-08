"use strict";

const ts = require('./tinyspeck.js'),
      datastore = require("./datastore.js").async;

var slack = ts.instance({ });
var connected=false;

//
// For each Slash Command that you want to handle, you need to add a new `slack.on()` handler function for it.
// This handler captures when that particular Slash Command has been used and the resulting HTTP request fired
// to your endpoint. You can then run whatever code you need to for your use-case. 
//
// The `slack` functions like `on()` and `send()` are provided by `tinyspeck.js`. 
//
// Watch for /count slash command
slack.on('/count', payload => {
  console.log("Received /count slash command from user " + payload.user_id);
  let user_id = payload.user_id;
  let response_url = payload.response_url;
  
  // and send the return value from that to `getMessage()`. This function checks to see if the value exists and if it doesn't then it sets an initial value of 1\. If it does, then it increments that value and stores the updated value with `datastore.set()`. We then use `slack.send()` to send our message text to the response URL the Slash Command provided us with. So we append the current count value to the String "Current count is: " and this is what appears as the response in the Slack channel where the Slash Command was used.
  
  getConnected() // make sure we have a database connection
    .then(function(){
      // we look for the stored count value using `datastore.get()` (which is a library function provided by datastore.js) 
      datastore.get(user_id) // get the count for the user_id
      .then(function(count){
        let message = getMessage(user_id, count);
                
        // send current count privately
        slack.send(response_url, message).then(res => { // on success
          console.log("Response sent to /count slash command");
        }, reason => { // on failure
          console.log("An error occurred when responding to /count slash command: " + reason);
        });
      });
    });
});
    
function getMessage(userRef, count) {
  if(!count){ // no value stored for this user
    count=1;
    datastore.set(userRef, count).then(function() { // store initial count value for user
      console.log("Saved initial count ("+count+") for: " + userRef);
    });
  } else { // there was a value stored
    count++;
    datastore.set(userRef, count).then(function() { // store updated count value for user
      console.log("Saved updated count ("+count+") for: " + userRef);
    });
  }
  return Object.assign({ channel: userRef, text: "Current count is: " + count });
}

function getConnected() {
  return new Promise(function (resolving) {
    if(!connected){
      connected = datastore.connect().then(function(){
        resolving();
      });
    } else {
      resolving();
    }
  });
}
    
// incoming http requests
slack.listen('3000');