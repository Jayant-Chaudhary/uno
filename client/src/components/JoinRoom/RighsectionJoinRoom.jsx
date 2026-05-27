import React, { useRef, useState } from "react";

const RighsectionJoinRoom = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);

  const codeRef = useRef(null);

  useEffect(() => {
    API.get("/auth/me")
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
        console.log("not signed in");
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const CodeDigits = [...roomCode].slice(0.6);

  const handleCodeInput = (e, index) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!val) return;
    const chars = [...roomCode];
    chars[index] = val[val.length - 1];
    const newCode = chars.join("").slice(0, 6);
    setRoomCode(newCode);
    if (index < 5 && val) {
      codeRefs.current[index + 1]?.focus();
    }
  };
  

  return <div></div>;
};

export default RighsectionJoinRoom;
