const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

const peer = new Peer(undefined, {
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
    if (connectedUsers[userId]) {
      connectedUsers[userId].close();
    }
    removeVideo(userId);
  });

  let text = document.getElementById("chat_message");
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && text.value.trim() !== "") {
      socket.emit('message', text.value);
      text.value = "";
    }
  });

  socket.on('createMessage', message => {
    document.querySelector(".messages").innerHTML += `<li class="message"><b>User</b><br/>${message}</li>`;
    scrollToBottom();
  });
});

peer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

const connectedUsers = {};

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  }); 
  call.on('close', () => {
    video.remove();
  });

  connectedUsers[userId] = call;
}

function addVideoStream(video, stream, userId) {
    video.srcObject = stream;
    video.setAttribute('data-userid', userId);
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
}

function removeVideo(userId) {
  document.querySelectorAll('video').forEach(video => {
    if (video.getAttribute('data-userid') === userId) {
      video.remove();
    }
  });
}

function muteUnmute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  myVideoStream.getAudioTracks()[0].enabled = !enabled;
  document.querySelector('.main__mute_button').innerHTML = enabled
    ? `<i class="unmute fas fa-microphone-slash"></i><span>Unmute</span>`
    : `<i class="fas fa-microphone"></i><span>Mute</span>`;
}

function playStop() {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  myVideoStream.getVideoTracks()[0].enabled = !enabled;
  document.querySelector('.main__video_button').innerHTML = enabled
    ? `<i class="stop fas fa-video-slash"></i><span>Play Video</span>`
    : `<i class="fas fa-video"></i><span>Stop Video</span>`;
}

function copyMeetCode() {
    navigator.clipboard.writeText(ROOM_ID).then(() => {
        alert('Meeting code copied to clipboard: ' + ROOM_ID);
    });
}

function leaveMeeting() {
    socket.emit('user-disconnected', peer.id);
    peer.destroy();
    window.location.href = "/";
}

function scrollToBottom() {
  let chatWindow = document.querySelector('.main__chat_window');
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
