'use strict';

var functions = require('firebase-functions');
const admin = require('firebase-admin');

// intialize admin
admin.initializeApp(functions.config().firebase);

const twilio = require('twilio');

const accountSid = 'ACc29f9f3979c240ccf8012604279d7afa';
const authToken = '6a97bab3e51cba02b37265fbe67e3ace';
//const client = new twilio(accountSid, authToken);
const twilioNumber = '+12673607280'; // your twilio phone number

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
/*
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
 });

*/

// deleting functions
exports.userDidDeleted = functions.auth.user().onDelete(event => {
  const user = event.data; // The Firebase user.
  admin
    .database()
    .ref('/users/' + user.uid)
    .remove();
});

exports.adminUserCreation = functions.database
  .ref('/users/{userUID}')
  .onWrite(event => {
    let userUID = event.params['userUID'];
    const user = event.data.val();
    console.log(userUID);
    console.log(user);
    let status = false;
    if (user.status === 'уволен') {
      status = true;
    }
    var userObject = {
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phone,
      disabled: status
    };
    return admin
      .auth()
      .updateUser(userUID, userObject)
      .then(userRecord =>  console.log('Successfully updated user', userRecord.toJSON()))
      .catch((error) => {
        console.log('Error updating user:', error);
      });
  });

/**
 * Triggers when a new alarm begins.
 *
 *
 *
 */
exports.sendServiceNotification = functions.database
  .ref('/alarms/{alarmId}')
  .onCreate(event => {
    const alarmKey = event.params.alarmId;
    const alarm = event.data.val();
    const mechanicId = alarm.lift.mechanicid;
    const superviserId = alarm.lift.superviserid;

    console.log(alarm);

    const text =
      alarm.lift.contract.building +
      '|' +
      alarm.lift.address +
      '|' +
      alarm.lift.contract.address;

    // Notification details.
    const payload = {
      notification: {
        title: 'авария NotifN' + alarmKey,
        body: text,
        sound: 'default',
        badge: '1'
      },
      data: {
        //you can send only notification or only data(or include both)
        type: '2', //time to send alarm
        alarm: alarmKey,
        title: 'авария №' + alarmKey,
        line1: text,
        line2: ''
      }
    };
    let topic = mechanicId;
    // Send a message to devices subscribed to the provided topic.
    admin
      .messaging()
      .sendToTopic(topic, payload)
      .then(response => console.log('Successfully sent message:', response))
      .catch((error) => {
        console.log('Error sending message:', error);
      });

    // Twillio
    /*   const phoneNumber = '+380678882727';
     if ( !validE164(phoneNumber) ) {
      throw new Error('number must be E164 format!')
      }
     const textMessage = {
      body: 'Авария:' + text,
      to: phoneNumber,  // Text to this number
      from: twilioNumber // From a valid Twilio number
     }
     client.messages.create(textMessage)
         .then(function(message) {
           console.log("Successfully sent twillio message:", message.sid);
                         })
          .catch(function(error) {
             console.log("Error sending twillio message:", error);
                    });*/
  });

/// Validate E164 format
function validE164(num) {
  return /^\+?[1-9]\d{1,14}$/.test(num);
}
