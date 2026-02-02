# Workasana

A full-stack chat app, where you can chat with any user who has account on it. It's main features are show unread messages number, tick provided for tracker user online or not, and turn the tick to blue when user seen the message.

## Demo Link
[Live Demo](add app website link)

## Quick Start

```
git clone "add app clone link frotend"
cd <app clone name here>
npm install
npm start
```

## Technologies
 * React JS
 * React Router
 * Node.js
 * Express
 * MongoDB
 * JWT
 * socket.io

## Demo Video
Watch a walkthrough of all the major features of this app: [Google Drive Link](https://drive.google.com/drive/folders/1_dGMryWWvsUrPT4DmYGSeL0agT3OMqPg?usp=sharing)

## Features

**Login Page**
- Login and Regsiter user Boxes are provided
- Unique username required to create the account

**Dashbord**
- Welcome message with user's name
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