import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const startMeeting = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    navigate(`/${newRoomId}`);
  };

  const joinMeeting = () => {
    if (roomId.trim()) {
      navigate(`/${roomId}`);
    } else {
      alert("Please enter a meeting code");
    }
  };

  return (
    <div className="home-container">
      <h1>Welcome to WeMeet</h1>
      <div className="join-container">
        <input
          type="text"
          placeholder="Enter Meeting Code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={joinMeeting}>Join Meeting</button>
      </div>
      <p>or</p>
      <button onClick={startMeeting}>Start Instant Meeting</button>
    </div>
  );
};

export default Home;
