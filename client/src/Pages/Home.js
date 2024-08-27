import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home({ socket }) {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      socket.on("join-room-res", (res) => {
        if (res === "ok") {
          navigate("/Game", { state: { roomName: roomName } });
        } else {
          alert("Can't Join Room. Room Is Full");
        }
      });

      return () => {
        socket.off("join-room-res");
      };
    }
  }, [socket, roomName, navigate]); // Added `roomName` to dependency array

  const handleClick = (e) => {
    e.preventDefault();
    if (socket) {
      socket.emit("join-room", roomName);
    }
  };

  return (
    <div className="App">
      <h1>21BCE11263 Aryan Rana</h1>
      <p>{socket ? socket.id : "Not Connected Yet"}</p>
      <br />
      <h2>Create Room :</h2>
      <form>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <br />
        <button type="submit" onClick={handleClick}>
          Enter
        </button>
      </form>
    </div>
  );
}

export default Home;
