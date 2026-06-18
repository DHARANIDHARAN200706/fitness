const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);

  socket.on("receiveMessage", (msg) => {
    console.log("RECEIVED:", msg);
    process.exit(0);
  });

  socket.emit("sendMessage", {
    id: "test",
    text: "Hello from test!",
    sender: { name: "Test User", _id: "test123", avatar: "" },
    timestamp: new Date().toISOString()
  });
  
  console.log("Message sent.");
});

setTimeout(() => {
  console.log("Timeout");
  process.exit(1);
}, 3000);
