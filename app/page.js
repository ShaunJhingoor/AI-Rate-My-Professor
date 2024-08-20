"use client";
import { useState, useEffect, useRef } from "react";
import { Box, TextField, Paper, Typography, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export default function Home() {
  const [messages,setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ])
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  
  const sendMessage = async () => {
    if (message.trim()) {
      setMessages((messages) => [
        ...messages,
        { role: 'user', content: message },
        { role: 'assistant', content: '' }
      ]);

    setMessage('')
    const response = fetch('/api/chat', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}]),
    }).then(async(res) =>{
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let result = ''
      return reader.read().then(function processText({done,value}){

        if (done){
          return result
        }
        const text = decoder.decode(value || new Uint8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {...lastMessage, content: lastMessage.content + text}
          ]
        })
        return reader.read().then(processText)
      })
    })
  }
 }
 const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
};

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

useEffect(() => {
  scrollToBottom();
}, [messages]);

return (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f4f8',
      padding: 2,
    }}
  >
    <Typography variant="h4" sx={{ textAlign: 'center', mb: 2 }}>
      AI Rate My Professor
    </Typography>
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 2,
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '80%',
        maxWidth: '600px',
        height: '80vh',
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: 2,
          marginBottom: '8px',
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: message.role === 'user' ? '#007aff' : '#e0e0e0',
                color: message.role === 'user' ? '#ffffff' : '#000000',
                maxWidth: '60%',
              }}
            >
              {message.content}
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f4f8', borderRadius: '20px', padding: '8px', marginTop: 'auto' }}>
        <TextField
          fullWidth
          placeholder="Type your message..."
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            backgroundColor: '#f0f4f8',
            borderRadius: '20px',
            marginRight: 1,
            '& fieldset': { border: 'none' },
          }}
        />
        <IconButton
          onClick={sendMessage}
          sx={{ backgroundColor: '#007bff', color: '#ffffff', borderRadius: '50%', padding: '10px' }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  </Box>
);
}