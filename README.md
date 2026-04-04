MERN Stack Real-Time Chat App

A full-stack real-time chat application built using the MERN stack — MongoDB, Express.js, React, Node.js — and Socket.io for live communication between users. 
This project enables multiple users to send and receive messages instantly without page refreshes.


Features

Real-time chat messaging with Socket.io
Backend API with Express.js & Node.js
Frontend UI using React.js
Message persistence with MongoDB
Clean project structure for easy extensibility

Tech Stack
Technology	Use
MongoDB	NoSQL database to store users/messages
Express.js	Backend web framework
React.js	Frontend UI library
Node.js	Server runtime
Socket.io	Real-time, bidirectional communication

Project Overview:

This project builds a real-time chat platform where users can send instant messages. It uses:

Socket.io for web socket communication between server and clients

REST API endpoints to interact with data

React for responsive frontend

MongoDB to persist chat history

The result is a scalable, real-time chat experience similar to modern messaging apps.


Installation:
Install backend dependencies
cd server
npm install


Create a .env file:

MONGO_URI=your_mongodb_uri
PORT=5001

Install frontend dependencies
cd ../client
npm install

Run the Application
Start the backend
cd server
npm start

Start the frontend
cd client
npm start


Core Functionality
Real-Time Messaging

Using Socket.io, the app listens for message events on the server and broadcasts them to connected clients instantly.

Database Storage

MongoDB stores chat messages and user metadata so conversations can persist across sessions.

