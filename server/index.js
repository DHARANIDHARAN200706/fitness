require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'risefit_super_secret_key';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8 // 100 MB to support large base64 avatars
});
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risefit')
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Seed Data Function
async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create({
      name: 'Jordan Eagle',
      email: 'jordan@example.com',
      progress: {
        title: 'Lower Body',
        type: 'Cardio',
        duration: '3 hours',
        level: 'Beginner',
        percentage: 72
      },
      recommendations: [
        { title: 'Pull Up', type: 'Cardio', duration: '15 minutes', level: 'Beginner', image: '/pull_up.png' },
        { title: 'Sit Up', type: 'Muscle', duration: '30 minutes', level: 'Middle', image: '/sit_up.png' },
        { title: 'Biceps curl', type: 'Strength', duration: '2 hours', level: 'Pro Suhu', image: '/pull_up.png' }
      ]
    });
    console.log('Seeded database with initial user data.');
  }
}

mongoose.connection.once('open', seedDatabase);

const fs = require('fs');
const path = require('path');
const mockDbPath = path.join(__dirname, 'mock-user.json');

const defaultMockUser = {
  name: 'Jordan Eagle',
  email: 'jordan@example.com',
  avatar: '/avatar.png',
  progress: {
    title: 'Lower Body',
    type: 'Cardio',
    duration: '3 hours',
    level: 'Beginner',
    percentage: 72
  },
  recommendations: [
    { title: 'Pull Up', type: 'Cardio', duration: '15 minutes', level: 'Beginner', image: '/pull_up.png' },
    { title: 'Sit Up', type: 'Muscle', duration: '30 minutes', level: 'Middle', image: '/sit_up.png' },
    { title: 'Biceps curl', type: 'Strength', duration: '2 hours', level: 'Pro Suhu', image: '/pull_up.png' }
  ]
};

function getMockUsers() {
  try {
    if (fs.existsSync(mockDbPath)) {
      const data = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      // Handle legacy single-object format
      if (data.name && !data['mock_id_123']) return { 'mock_id_123': data };
      return data;
    }
  } catch (e) {
    console.error('Error reading mock DB', e);
  }
  return { 'mock_id_123': defaultMockUser };
}

function saveMockUsers(data) {
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing mock DB', e);
  }
}

// API Routes
app.post('/api/login', async (req, res) => {
  try {
    const { phone, name, dob, height, weight, avatar, isLoginMode } = req.body;
    
    // Fallback to mock data if DB is down
    if (mongoose.connection.readyState !== 1) {
      const users = getMockUsers();
      
      let existingId = Object.keys(users).find(id => users[id].phone === phone || (!isLoginMode && users[id].name === name));
      
      if (isLoginMode) {
        if (!existingId) {
          return res.status(400).json({ error: 'Account not found. Please sign up first.' });
        }
        const token = jwt.sign({ userId: existingId }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: users[existingId] });
      }

      let userId = existingId || 'mock_id_' + Date.now();
      
      users[userId] = {
        ...defaultMockUser,
        ...users[userId],
        name: name || (users[userId] ? users[userId].name : defaultMockUser.name),
        avatar: avatar || (users[userId] ? users[userId].avatar : defaultMockUser.avatar),
        phone: phone || '',
        _id: userId
      };
      
      saveMockUsers(users);
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: users[userId] });
    }

    let user = await User.findOne({ phone });
    
    if (isLoginMode) {
      if (!user) {
        return res.status(400).json({ error: 'Account not found. Please sign up first.' });
      }
    } else {
      if (!user) {
        user = new User({
          phone, name, dob, height, weight, avatar,
          progress: defaultMockUser.progress,
          recommendations: defaultMockUser.recommendations
        });
      } else {
        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
      }
      await user.save();
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    let userId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (mongoose.connection.readyState !== 1) {
      console.log('Serving mock data (MongoDB not connected)');
      const users = getMockUsers();
      return res.json(users[userId] || users['mock_id_123'] || defaultMockUser);
    }
    
    let user;
    if (userId && !userId.startsWith('mock_id_')) {
      user = await User.findById(userId);
    } else {
      user = await User.findOne();
    }

    if (!user) {
      const users = getMockUsers();
      return res.json(users['mock_id_123'] || defaultMockUser);
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    const users = getMockUsers();
    res.json(users['mock_id_123'] || defaultMockUser); // Fallback to mock data
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    const hasImage = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'));
    const model = hasImage ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.1-8b-instant';
    const systemPrompt = hasImage 
      ? 'You are an enthusiastic AI fitness coach and expert nutritionist for the RiseFit app. If the user uploads a photo of food/meals, identify it, estimate its calories and macros, give brief feedback, and be encouraging. Keep it short and punchy (3-4 sentences max). Use emojis.' 
      : 'You are an enthusiastic, motivating AI fitness coach for the RiseFit app. Keep your responses short, punchy, and highly encouraging (1-2 sentences max). Use emojis.';

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await groqResponse.json();
    if (data.error) throw new Error(data.error.message);
    
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('Groq Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

app.get('/api/users', (req, res) => {
  const users = getMockUsers();
  const usersArray = Object.values(users).map(u => ({
    _id: u._id,
    name: u.name,
    avatar: u.avatar,
    following: u.following || [],
    followers: u.followers || [],
    unreadMessages: u.unreadMessages || {},
    posts: u.posts || [],
    score: u.score || 0
  }));
  res.json(usersArray);
});

app.post('/api/users/update', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    let currentUserId;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name, avatar } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const users = getMockUsers();
      if (!users[currentUserId]) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (name) users[currentUserId].name = name;
      if (avatar) users[currentUserId].avatar = avatar;
      saveMockUsers(users);
      return res.json(users[currentUserId]);
    }

    let user;
    if (currentUserId && !currentUserId.startsWith('mock_id_')) {
      user = await User.findById(currentUserId);
    } else {
      user = await User.findOne();
    }

    if (!user) {
      const users = getMockUsers();
      if (users[currentUserId]) {
        if (name) users[currentUserId].name = name;
        if (avatar) users[currentUserId].avatar = avatar;
        saveMockUsers(users);
        return res.json(users[currentUserId]);
      }
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    await user.save();
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

app.post('/api/users/score', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const { score } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'Score must be a number' });

  const users = getMockUsers();
  const user = users[currentUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.score = (user.score || 0) + score;
  saveMockUsers(users);

  res.json({ success: true, score: user.score });
});

app.post('/api/users/post', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Image is required' });

  const users = getMockUsers();
  const user = users[currentUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.posts) user.posts = [];
  user.posts.unshift({ 
    id: Date.now().toString(), 
    image, 
    timestamp: new Date().toISOString(),
    likes: [],
    comments: []
  });
  saveMockUsers(users);

  res.json({ success: true, posts: user.posts });
});

app.post('/api/users/post/:postId/like', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const postId = req.params.postId;
  const users = getMockUsers();
  const currentUser = users[currentUserId];
  
  for (const uid in users) {
    if (users[uid].posts) {
      const post = users[uid].posts.find(p => p.id === postId);
      if (post) {
        if (!post.likes) post.likes = [];
        const likeIndex = post.likes.indexOf(currentUserId);
        if (likeIndex > -1) {
          post.likes.splice(likeIndex, 1);
        } else {
          post.likes.push(currentUserId);
          
          // Add notification if not liking own post
          if (uid !== currentUserId) {
            const newNotif = {
              id: Date.now().toString(),
              type: 'like',
              fromUser: { _id: currentUserId, name: currentUser.name, avatar: currentUser.avatar },
              read: false,
              timestamp: new Date().toISOString()
            };
            if (!users[uid].notifications) users[uid].notifications = [];
            users[uid].notifications.unshift(newNotif);
            
            io.to(uid).emit('receiveFollowNotification', { ...newNotif, targetUserId: uid });
          }
        }
        saveMockUsers(users);
        return res.json({ success: true, likes: post.likes });
      }
    }
  }
  res.status(404).json({ error: 'Post not found' });
});

app.post('/api/users/post/:postId/comment', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text required' });

  const postId = req.params.postId;
  const users = getMockUsers();
  const currentUser = users[currentUserId];
  
  for (const uid in users) {
    if (users[uid].posts) {
      const post = users[uid].posts.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        const newComment = {
          id: Date.now().toString(),
          userId: currentUserId,
          text: text,
          timestamp: new Date().toISOString()
        };
        post.comments.push(newComment);

        // Add notification if not commenting on own post
        if (uid !== currentUserId) {
          const newNotif = {
            id: Date.now().toString(),
            type: 'comment',
            fromUser: { _id: currentUserId, name: currentUser.name, avatar: currentUser.avatar },
            read: false,
            timestamp: new Date().toISOString()
          };
          if (!users[uid].notifications) users[uid].notifications = [];
          users[uid].notifications.unshift(newNotif);
          
          io.to(uid).emit('receiveFollowNotification', { ...newNotif, targetUserId: uid });
        }

        saveMockUsers(users);
        return res.json({ success: true, comments: post.comments });
      }
    }
  }
  res.status(404).json({ error: 'Post not found' });
});

app.post('/api/users/:id/follow', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const users = getMockUsers();
  const targetUserId = req.params.id;

  if (!users[currentUserId] || !users[targetUserId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentUser = users[currentUserId];
  const targetUser = users[targetUserId];

  if (!currentUser.following) currentUser.following = [];
  if (!targetUser.followers) targetUser.followers = [];

  const followingIndex = currentUser.following.indexOf(targetUserId);
  if (followingIndex > -1) {
    currentUser.following.splice(followingIndex, 1);
    targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
  } else {
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
    
    // Add notification
    const newNotif = {
      id: Date.now().toString(),
      type: 'follow',
      fromUser: { _id: currentUserId, name: currentUser.name, avatar: currentUser.avatar },
      read: false,
      timestamp: new Date().toISOString()
    };
    if (!targetUser.notifications) targetUser.notifications = [];
    targetUser.notifications.unshift(newNotif);
    
    // Emit real-time event
    io.to(targetUserId).emit('receiveFollowNotification', {
      targetUserId: targetUserId,
      fromUser: newNotif.fromUser
    });
  }

  saveMockUsers(users);
  res.json({ success: true, following: currentUser.following });
});

app.get('/api/notifications', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const users = getMockUsers();
  const user = users[currentUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  let allNotifs = [...(user.notifications || [])];

  if (user.unreadMessages) {
    Object.keys(user.unreadMessages).forEach(senderId => {
      const count = user.unreadMessages[senderId];
      if (count > 0 && users[senderId]) {
        allNotifs.push({
          id: `msg_${senderId}`,
          type: 'message',
          fromUser: {
            _id: senderId,
            name: users[senderId].name,
            avatar: users[senderId].avatar
          },
          count: count,
          read: false,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  allNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(allNotifs);
});

app.post('/api/notifications/read', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const users = getMockUsers();
  const user = users[currentUserId];
  if (user && user.notifications) {
    user.notifications.forEach(n => n.read = true);
    saveMockUsers(users);
  }
  res.json({ success: true });
});

app.get('/api/chat/private/:userId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const targetUserId = req.params.userId;
  const privateChatPath = path.join(__dirname, 'mock-private-chat.json');
  let privateChats = [];
  try {
    if (fs.existsSync(privateChatPath)) {
      privateChats = JSON.parse(fs.readFileSync(privateChatPath, 'utf8'));
    }
  } catch(e) {}

  const history = privateChats.filter(msg => 
    (msg.sender._id === currentUserId && msg.recipientId === targetUserId) ||
    (msg.sender._id === targetUserId && msg.recipientId === currentUserId)
  );
  
  res.json(history);
});

app.post('/api/chat/read/:senderId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  let currentUserId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    currentUserId = decoded.userId;
  } catch (e) { return res.status(401).json({ error: 'Invalid token' }); }

  const senderId = req.params.senderId;
  const users = getMockUsers();
  if (users[currentUserId] && users[currentUserId].unreadMessages) {
    users[currentUserId].unreadMessages[senderId] = 0;
    saveMockUsers(users);
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;

// Socket.io chat logic
const onlineUsers = new Map();
const chatHistoryPath = path.join(__dirname, 'mock-chat.json');
let chatHistory = []; // Store the latest messages

try {
  if (fs.existsSync(chatHistoryPath)) {
    chatHistory = JSON.parse(fs.readFileSync(chatHistoryPath, 'utf8'));
  }
} catch (e) {
  console.error('Error loading chat history', e);
}

function saveChatHistory() {
  try {
    fs.writeFileSync(chatHistoryPath, JSON.stringify(chatHistory, null, 2));
  } catch (e) {
    console.error('Error saving chat history', e);
  }
}

const privateChatPath = path.join(__dirname, 'mock-private-chat.json');
let privateChats = [];
try {
  if (fs.existsSync(privateChatPath)) {
    privateChats = JSON.parse(fs.readFileSync(privateChatPath, 'utf8'));
  }
} catch (e) {}

function savePrivateChats() {
  try {
    fs.writeFileSync(privateChatPath, JSON.stringify(privateChats, null, 2));
  } catch (e) {
    console.error('Error saving private chat history', e);
  }
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('userJoined', (user) => {
    socket.join(user._id); // Join private room
    onlineUsers.set(socket.id, user);
    io.emit('updateOnlineUsers', Array.from(onlineUsers.values()));
    // Send existing chat history to the newly joined user
    socket.emit('chatHistory', chatHistory);
  });

  socket.on('sendMessage', (messageData) => {
    console.log('Server received message:', messageData.text, 'from', messageData.sender.name);
    // Save to history and keep only the last 100 messages
    chatHistory.push(messageData);
    if (chatHistory.length > 100) chatHistory.shift();
    saveChatHistory();
    
    // Broadcast to all users
    io.emit('receiveMessage', messageData);
  });

  socket.on('sendPrivateMessage', (messageData) => {
    privateChats.push(messageData);
    savePrivateChats();
    
    // Add to unreadMessages
    const users = getMockUsers();
    const recipient = users[messageData.recipientId];
    if (recipient) {
       if (!recipient.unreadMessages) recipient.unreadMessages = {};
       recipient.unreadMessages[messageData.sender._id] = (recipient.unreadMessages[messageData.sender._id] || 0) + 1;
       saveMockUsers(users);
       
       // Emit update event so the recipient's UI updates the badge instantly
       io.to(messageData.recipientId).emit('updateUnreadMessages', recipient.unreadMessages);
    }
    
    io.to(messageData.recipientId).emit('receivePrivateMessage', messageData);
    // also emit to sender if they are connected on multiple devices
    if (messageData.sender._id !== messageData.recipientId) {
      io.to(messageData.sender._id).emit('receivePrivateMessage', messageData);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    onlineUsers.delete(socket.id);
    io.emit('updateOnlineUsers', Array.from(onlineUsers.values()));
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
