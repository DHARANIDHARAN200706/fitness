const { io } = require("socket.io-client");

const client1 = io("http://localhost:5000");
const client2 = io("http://localhost:5000");

client1.on("connect", () => {
  console.log("Client 1 connected");
  client1.emit("userJoined", { _id: "c1", name: "Client 1", avatar: "" });
  
  setTimeout(() => {
    client1.emit("sendMessage", {
      id: "test_" + Date.now(),
      text: "Hello from client 1",
      sender: { name: "Client 1", _id: "c1", avatar: "" },
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

client2.on("connect", () => {
  console.log("Client 2 connected");
  client2.emit("userJoined", { _id: "c2", name: "Client 2", avatar: "" });
});

client2.on("receiveMessage", (msg) => {
  console.log("Client 2 received message:", msg);
  process.exit(0);
});

setTimeout(() => {
  console.log("Timeout: Client 2 did not receive message");
  process.exit(1);
}, 3000);
