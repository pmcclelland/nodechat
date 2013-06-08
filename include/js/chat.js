var socket = null;
var currentRoom = '';
var username = null;
var roomList = {
    'dev': '',
    'field': '',
    'office': ''
};
var userList = {
    'dev': [],
    'field': [],
    'office': []
};

var messageTemplate = '';
var userlistTemplate = '';

/**
 * Connects and sets up the socket.
 */
function connectSocket(roomId) {
    socket = null;
    socket = io.connect(window.location.hostname + ':1337');

    socket.on('connect', function() {
        for (var room in roomList) {
            joinRoom(room);
        }
        switchRoom(roomId);
    });

    socket.on('chat', function(data) {
        updateConversation(data);
    });

    socket.on('userJoin', function(data) {
        updateUserList(data);
    });

    socket.on('userLeave', function(data) {
        removeFromUserList(data);
    });
}

/**
 * Submits whatever has been typed into #message to the socket.
 */
function submitChat() {
    var input = $('#message').val();
    
    if (input) {
        socket.emit('message', {message: input, room: currentRoom});
    }

    // Clear the typed message.
    $('#message').val('');
}

/**
 * Updates the conversation with newly appended text. Scrolls conversation to the bottom.
 */
function updateConversation(data) {
    if (data['room'] == currentRoom) {
        $('#conversation > div.container').append(messageTemplate(data));
        $('#conversation').scrollTop($('#conversation')[0].scrollHeight);
    }
    roomList[data['room']] += messageTemplate(data);
}

/**
 * Updates the user list
 */
function updateUserList(input) {
    var data = {
        username: input['username'],
        room: input['room'],
        notice: 'joined'
    };
    if (!('firstJoin' in input)) {
        updateConversation(data);
    }
    
    userList[data['room']].push(input['username']);
    if (data['room'] == currentRoom) {
        showUserList(currentRoom);
    }
}

/**
 * Removes a dude from the user list
 */
function removeFromUserList(input) {
    var data = {
        username: input['username'],
        room: input['room'],
        notice: 'left'
    };
    updateConversation(data);
    userList[input['room']].splice(userList[input['room']].indexOf(input['username']), 1);
    if (input['room'] == currentRoom) {
        showUserList(input['room']);
    }
}

/**
 * Show user list for a certain room
 */
function showUserList(room) {
    $('#userList').html('');
    for (i in userList[room]) {
    	var data = {
    	    username: userList[room][i],
    	    room: currentRoom,
    	    notice: 'joined'
    	};
    	$('#userList').append(userlistTemplate(data));
    }
}

/**
 * Leave old room if there is one, then join a new room
 */
function joinRoom(room) {
    socket.emit('join', {username: username, room: room});
}

function switchRoom(room) {

    if (room != currentRoom) {
        $('#room_' + currentRoom).removeClass('btn-info');
        $('#room_' + room).addClass('btn-info');
        showUserList(room)
        $('#conversation > div.container').html(roomList[room]);
        $('#conversation').scrollTop($('#conversation')[0].scrollHeight);

        currentRoom = room;
    }
    
};

$(document).ready(function() {

    // HandleBars Templates
    var messageHTML = $('#message-template').html();
    messageTemplate = Handlebars.compile(messageHTML);

    var userlistHTML = $('#userlist-template').html();
    userlistTemplate = Handlebars.compile(userlistHTML);
    
    var roomId = '',
        modal;

    // Bound js events
    $('#send').bind('click', function() {
        submitChat();
    });

    $('#room_dev').bind('click', function() { switchRoom('dev'); });
    $('#room_field').bind('click', function() { switchRoom('field'); });
    $('#room_office').bind('click', function() { switchRoom('office'); });

    $('#message').keypress(function(e) {
        if (e.which == 13) {
            submitChat();
        }
    });

    $('#saveSignin').click(function(e) {
        username = $('#nickInput').val();
        roomId = $('#selectRoom').find(':selected').val();
        if (username && roomId) {
            $('#signin').modal('hide');
            connectSocket(roomId);
        } else {
            // Show error warning
            $('#signinError').show();
        }
    });

    modal = $('#signin').modal({
        backdrop: 'static',
        keyboard: false,
        show: true
    });
});
