import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Game from "./Pages/Game";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const App = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize the socket connection
    const newSocket = io.connect("http://localhost:3001");
    setSocket(newSocket);

    // Clean up the socket connection on component unmount
    return () => {
      if (newSocket) newSocket.disconnect(); // Ensure to use .disconnect()
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home socket={socket} />} />
        <Route path="/Game" element={<Game socket={socket} />} />
      </Routes>
    </>
  );
};

export default App;
