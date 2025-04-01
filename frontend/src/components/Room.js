import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Peer from "peerjs";
import "./Room.css";

const Room = () => {
  const { roomId } = useParams();
  const socketRef = useRef();
  const peerRef = useRef();
  const myVideoRef = useRef();
  const videoGridRef = useRef();
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");
    peerRef.current = new Peer(undefined, {
      host: "/",
      port: "3001",
      path: "/peerjs",
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myVideoRef.current.srcObject = stream;

      peerRef.current.on("open", (id) => {
        socketRef.current.emit("join-room", roomId, id);
      });

      socketRef.current.on("user-connected", (userId) => {
        connectToNewUser(userId, stream);
      });

      peerRef.current.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (userStream) => {
          addVideoStream(userStream);
        });
      });

      socketRef.current.on("user-disconnected", (userId) => {
        console.log("User disconnected:", userId);
      });

      socketRef.current.on("createMessage", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    });

    return () => {
      socketRef.current.disconnect();
      peerRef.current.destroy();
    };
  }, [roomId]);

  const connectToNewUser = (userId, stream) => {
    const call = peerRef.current.call(userId, stream);
    call.on("stream", (userStream) => {
      addVideoStream(userStream);
    });
  };

  const addVideoStream = (stream) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => video.play());
    videoGridRef.current.append(video);
  };

  const muteUnmute = () => {
    const enabled = myVideoRef.current.srcObject.getAudioTracks()[0].enabled;
    myVideoRef.current.srcObject.getAudioTracks()[0].enabled = !enabled;
  };

  const playStop = () => {
    const enabled = myVideoRef.current.srcObject.getVideoTracks()[0].enabled;
    myVideoRef.current.srcObject.getVideoTracks()[0].enabled = !enabled;
  };

  const sendMessage = () => {
    if (chatMessage.trim() !== "") {
      socketRef.current.emit("message", chatMessage);
      setChatMessage("");
    }
  };

  const copyMeetCode = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Meeting code copied!");
  };

  const leaveMeeting = () => {
    navigate("/");
  };

  return (
    <div className="main">
      <div className="main__left">
        <div className="main__videos">
          <video ref={myVideoRef} autoPlay playsInline muted></video>
          <div ref={videoGridRef} id="video-grid"></div>
        </div>
        <div className="main__controls">
          <div className="main__controls__block">
            <button onClick={muteUnmute} className="main__controls__button">
              <i className="fas fa-microphone"></i> Mute
            </button>
            <button onClick={playStop} className="main__controls__button">
              <i className="fas fa-video"></i> Stop Video
            </button>
          </div>
          <div className="main__controls__block">
            <button onClick={copyMeetCode} className="main__controls__button">
              <i className="fas fa-copy"></i> Copy Code
            </button>
            <button className="main__controls__button">
              <i className="fas fa-user-friends"></i> Participants
            </button>
            <button className="main__controls__button">
              <i className="fas fa-comment-alt"></i> Chat
            </button>
          </div>
          <div className="main__controls__block">
            <button onClick={leaveMeeting} className="main__controls__button leave_meeting">
              Leave Meeting
            </button>
          </div>
        </div>
      </div>
      <div className="main__right">
        <div className="main__header">
          <h6>Chat</h6>
        </div>
        <div className="main__chat_window">
          <ul className="messages">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
        <div className="main__message_container">
          <input
            type="text"
            placeholder="Type message here..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Room;
