nodechat
========

Node.js session supported chat app utilizing Express/socket.io with redis for pubsub as well as storing sessions and persisting the chat state.

![screenshot](http://i.imgur.com/so0veVx.png)

Developed as part of a hackathon at work so it is still a little bit rough around the edges. Made minimal use of Express to allow for the client to be fully decoupled from Node.js at some later point. I chose to use handlebars templates instead of using a templating engine (EJS/Jade) in Express for this reason.

Future Development:
-------------------

There were some features I would like to get working but didn't have time to complete within the time constraints of the hackathon. I will look at adding this stuff when I get a chance as well as refactoring the code to make it a little bit more elegant. 

- Multi-Room Chat
- Private Messaging
- oAuth Authentication
- Gravatar Support
- Desktop Notifications

I was just trying to get as much working as I could in a short timeframe and as such I am pretty pleased with the results. If anyone wants to contribute to this project and help develop this further that would be great. I am still fairly new to Node.js and welcome the chance to learn more.

Usage:
------

Redis needs to be running

    npm install
    node app.js
    
    run @ http://hostname:1337