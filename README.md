# ChatApp

A full‑stack chat app where any user with an account can chat in real time. It shows unread message counts and tracks whether users are online. Message ticks update to green when a message is seen by the recipient.

## Demo Link
[Live Demo](https://chat-app-tool-ten-nu.vercel.app/)

## Quick Start

```
git clone "https://github.com/vickykumar3510/chatApp_Frontend.git"
cd <chatApp_Frontend>
npm install
npm start
```

## Technologies
 * React JS
 * React Router
 * Node.js
 * Express
 * MongoDB
 * Socket.IO
 * Axios

## Demo Video
Watch a walkthrough of all the major features of this app: [Google Drive Link](https://drive.google.com/drive/folders/1_dGMryWWvsUrPT4DmYGSeL0agT3OMqPg?usp=sharing)

## Features

**Login Page**
- User login box provided
- Credentials validated with backend API
- Incorrect password alerts shown

**Register Page**
- User registration box provided
- Unique username required to create account
- Success alert and redirect to Login page

**Dashbord**
- Name logo as a profile picture
- List of users in left side
- Emoji(s) and text box are provided to chat
- Clicking enter will the send the text also

## API Reference

**GET/api/messages**<br>
Show the messages<br> 

**GET/api/users**<br>
List of users<br> 

Sample Response:
```
[{ _id, username, password, createdAt, __v }]
```

**GET/api/unread-count**<br>
Number of unread messages<br> 

**GET/api/chat-dates**<br>
To get the messages dates<br> 

**POST/api/register**<br>
To register new  user<br>

**GET/api/login**<br>
To login the user<br>

## Contact
For bugs or feature requests, please reach out to vicky.kumar3510@gmail.com