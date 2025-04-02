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

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  document.querySelector('.main__mute_button').innerHTML = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
};

const setUnmuteButton = () => {
  document.querySelector('.main__mute_button').innerHTML = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
};

const setStopVideo = () => {
  document.querySelector('.main__video_button').innerHTML = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
};

const setPlayVideo = () => {
  document.querySelector('.main__video_button').innerHTML = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
};

// Meeting Code Copy Feature
const copyMeetCode = () => {
  navigator.clipboard.writeText(ROOM_ID).then(() => {
    alert("Meeting Code Copied: " + ROOM_ID);
  });
};

const videoGrid = document.getElementById('video-grid');
const socket = io('/');
var peer = new Peer(undefined, { path: '/peerjs', host: '/', port: '443' });

let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  myVideoStream = stream;

  // Apne video ko sirf ek baar add karo
  addVideoStream(myVideo, stream, USERNAME, peer.id);

  peer.on('call', call => {
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream, call.metadata.username, call.peer);
      });
  });

  socket.on('user-connected', (userId, username) => {
      setTimeout(() => {
          if(userId !== peer.id) { // Apna video dobara na add ho
              connectToNewUser(userId, stream, username);
          }
      }, 1000);
  });

  socket.on('user-disconnected', userId => {
      if (peers[userId]) {
          peers[userId].close();
          removeVideo(userId);
          delete peers[userId];
      }
  });

  document.getElementById("chat_message").addEventListener("keydown", e => {
      if (e.key === "Enter") {
          let message = e.target.value;
          if (message.trim()) {
              socket.emit('message', message, USERNAME);
              e.target.value = "";
          }
      }
  });

  socket.on('createMessage', ({ message, sender }) => {
      document.querySelector('.messages').innerHTML += `<li><b>${sender}:</b> ${message}</li>`;
  });
});

peer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id, USERNAME);
});

const connectToNewUser = (userId, stream, username) => {
  if(peers[userId] || userId === peer.id) return; // Apne aap se dobara connect hone se bacho

  const call = peer.call(userId, stream, { 
      metadata: { username: USERNAME } 
  });

  const video = document.createElement('video');

  call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream, username, userId);
  });

  call.on('close', () => {
      removeVideo(userId);
      delete peers[userId];
  });

  peers[userId] = call;
};

const addVideoStream = (video, stream, username, userId) => {
  if (document.querySelector(`.video-container [data-userid="${userId}"]`)) {
      console.log(`User ${username} ka video already exist karta hai, dobara nahi add karenge.`);
      return;
  }

  video.srcObject = stream;
  video.setAttribute('data-userid', userId);
  video.addEventListener('loadedmetadata', () => {
      video.play().catch(err => console.log('Video play error:', err));
  });

  const container = document.createElement('div');
  container.className = 'video-container';
  container.innerHTML = `
      <div class="username-label">${username}</div>
  `;
  container.prepend(video);

  videoGrid.appendChild(container);
};

const removeVideo = (userId) => {
  const videoElement = document.querySelector(`.video-container [data-userid="${userId}"]`);
  if(videoElement) {
      videoElement.parentElement.remove();
  }
};

const leaveMeeting = () => {
  socket.emit('user-disconnected', peer.id);
  peer.destroy();
  window.location.href = "/";
};