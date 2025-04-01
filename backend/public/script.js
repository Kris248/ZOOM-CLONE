const removeVideo = (userId) => {
  document.querySelectorAll('video').forEach(video => {
    if (video.getAttribute('data-userid') === userId) {
      video.remove();
    }
  });
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

// Leave Meeting Functionality
const leaveMeeting = () => {
  socket.emit('user-disconnected', peer.id);
  peer.destroy();
  window.location.href = "/";
};

const videoGrid = document.getElementById('video-grid');
const socket = io('/');

var peer = new Peer(undefined, { path: '/peerjs', host: '/', port: '443' });

let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, USERNAME);

    peer.on('call', call => {
      call.answer(stream);
      const video = document.createElement('video');
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, call.metadata.username);
      });
    });

    socket.on('user-connected', (userId, username) => {
      connectToNewUser(userId, stream, username);
    });

    socket.on('user-disconnected', userId => {
      document.querySelectorAll(`[data-userid="${userId}"]`).forEach(video => video.remove());
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
  const call = peer.call(userId, stream, { metadata: { username } });
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream, username);
  });
};

const addVideoStream = (video, stream, username) => {
  video.srcObject = stream;
  video.setAttribute('data-userid', username);
  video.addEventListener('loadedmetadata', () => video.play());

  let container = document.createElement('div');
  container.classList.add('video-container');
  container.appendChild(video);

  let label = document.createElement('div');
  label.classList.add('username-label');
  label.innerText = username;
  container.appendChild(label);

  videoGrid.append(container);
};
