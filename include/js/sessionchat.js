var templates = {};
var socket = null;

function submitChat() {
    var input = $('#message').val() || $('#markdownEditor').val();
    var data = {
        message: input,
        messageType: 'message'
    };
    
    if (input) {
        socket.emit('chat', JSON.stringify(data));
    }

    // Clear the typed message.
    $('#message').val('');
}

function leaveChat() {
    $.get('/logout', function() {
        location.reload();
    });
}

function updateConversation(data) {
    switch(data.messageType) {
        case 'message':
            $('#conversation > div.container-fluid').append(templates.messageTemplate(data));
            break;
        case 'status':
            $('#conversation > div.container-fluid').append(templates.statusTemplate(data));
            break;
    }
    $('#conversation').scrollTop($('#conversation')[0].scrollHeight);
}

function connectSocket(username) {
    socket = io.connect(window.location.hostname + ':1337'); 

    $.get('/user', function(username) {
        socket.emit('join', JSON.stringify({}));
    }).error(function() {
        $.post('/user', {"user": username})
            .success(function () {
                // send join message
                socket.emit('join', JSON.stringify({}));
            }).error(function () {
                console.log("error");
        });
    });

    socket.on('chat', function(message) {
        var data = JSON.parse(message);
        updateConversation(data);
    });

    socket.on('useradd', function(username) {
        $('#userList').append(templates.userlistTemplate({username: username}));
    });

    socket.on('userdel', function(username) {
        $('#' + username).remove();
    });
}

$(document).ready(function() {
    // HandleBars Templates
    var messageHTML = $('#message-template').html();
    templates.messageTemplate = Handlebars.compile(messageHTML);

    var statusHTML = $('#status-template').html();
    templates.statusTemplate = Handlebars.compile(statusHTML);

    var userlistHTML = $('#userlist-template').html();
    templates.userlistTemplate = Handlebars.compile(userlistHTML);

    var sessionHTML = $('#session-template').html();
    templates.sessionTemplate = Handlebars.compile(sessionHTML);
    
    var modal = $('#signin').modal({
        backdrop: 'static',
        keyboard: false,
        show: false
    });  

    // Bound js events
    $('#session').on('click', 'button#logout', function() {
        leaveChat();
    });

    $('#markdownSubmit').on('click', function() {
        submitChat();
    });

    $('#message').keypress(function(e) {
        if (e.which == 13 && $("#message").is(":focus")) {
            submitChat();
        }
    });

    $('#saveSignin').click(function(e) {
        var username = $('#nickInput').val();
        if (username) {
            $('#signin').modal('hide');
            $('#session').append(templates.sessionTemplate({username: username}));
            connectSocket(username);
        } else {
            // Show error warning
            $('#signinError').show();
        }
    });

    $.get('/user', function(username) {
        $('#session').append(templates.sessionTemplate({username: username}));
        connectSocket(username);
    }).fail(function() {
        $('#signin').modal('show'); 
    }); 

    
});