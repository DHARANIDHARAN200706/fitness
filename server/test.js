const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Test client connected. ID:", socket.id);
  
  socket.on("receiveMessage", (msg) => {
    console.log("Test client received broadcast:", msg);
    process.exit(0);
  });

  socket.emit("sendMessage", {
    id: "123",
    text: "Testing 123",
    sender: { name: "Test", avatar: "", _id: "test" },
    timestamp: new Date().toISOString()
  });
  console.log("Sent message.");
});

setTimeout(() => {
  console.log("Timeout waiting for receiveMessage.");
  process.exit(1);
}, 3000);
