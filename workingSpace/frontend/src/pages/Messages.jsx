import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Üzenetek</h1>
        <div className="card">
          {messages.map((message) => (
            <div key={message.id} style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
              <h3>{message.title}</h3>
              <p>{message.content}</p>
              <small>Státusz: {message.status} | {new Date(message.created_at).toLocaleString('hu-HU')}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
