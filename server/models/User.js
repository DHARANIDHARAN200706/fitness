const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String },
  name: { type: String, required: true },
  email: { type: String },
  dob: { type: String },
  height: { type: Number },
  weight: { type: Number },
  avatar: { type: String, default: '/avatar.png' },
  progress: {
    title: { type: String, default: 'Lower Body' },
    type: { type: String, default: 'Cardio' },
    duration: { type: String, default: '3 hours' },
    level: { type: String, default: 'Beginner' },
    percentage: { type: Number, default: 72 }
  },
  recommendations: [
    {
      title: String,
      type: String,
      duration: String,
      level: String,
      image: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
