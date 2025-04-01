const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;
const socket = io('/');

var peer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});

let myVideoStream;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream; 
  addVideoStream(myVideo, stream);

  peer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });

  socket.on('user-disconnected', userId => {
    console.log(`User ${userId} disconnected`);
    if (connectedUsers[userId]) {
      connectedUsers[userId].close(); // PeerJS call ko close karo
    }
    removeVideo(userId); // Frontend se video hatao
  });
  
  const removeVideo = (userId) => {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.getAttribute('data-userid') === userId) {
        video.remove(); // Video element hatao
      }
    });
  };  

  let text = $("input")
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      console.log(text.val());
      socket.emit('message', text.val());
      text.val('');
    }
  });

  socket.on('createMessage', message => {
    $('.messages').append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom();
  });
});

peer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

const connectedUsers = {};

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  }); 
  call.on('close', () => {
    video.remove();
  });

  connectedUsers[userId] = call;
};

const addVideoStream = (video, stream, userId) => {
    video.srcObject = stream;
    video.setAttribute('data-userid', userId); // Video element ko userId assign karo
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
  };
  

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop('scrollHeight'));
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
};

const playStop = () => {
  console.log('object');
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
};

const leaveMeeting = () => {
    socket.emit('user-disconnected', peer.id); // Server ko batao user gaya
    peer.destroy(); // PeerJS connection close karo
    window.location.href = "/"; // Home page pe redirect karo ya jo bhi exit ka logic ho
  };
  