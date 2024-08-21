"use client";
import { useState, useRef } from "react";
import {
  Box,
  TextField,
  Paper,
  Typography,
  IconButton,
  Button,
  Autocomplete,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Rate My Professor support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [filteredMessage, setFilteredMessage] = useState("");
  const [url, setUrl] = useState("");
  const [field, setField] = useState("");
  const [school, setSchool] = useState("");
  const [top, setTop] = useState("");
  const [toggleQuery, setToggleQuery] = useState(false);

  const messagesEndRef = useRef(null);

  const subjects = [
    "Accounting",
    "Aerospace Engineering",
    "Anthropology",
    "Art History",
    "Biochemistry",
    "Biomedical Engineering",
    "Business Administration",
    "Chemical Engineering",
    "Chemistry",
    "Civil Engineering",
    "Classics",
    "Computer Science",
    "Criminology",
    "Economics",
    "Education",
    "Electrical Engineering",
    "English Literature",
    "Environmental Science",
    "Finance",
    "Genetics",
    "Geography",
    "Geology",
    "History",
    "Human Resources",
    "Information Technology",
    "International Relations",
    "Law",
    "Linguistics",
    "Marketing",
    "Mathematics",
    "Mechanical Engineering",
    "Medicine",
    "Microbiology",
    "Music",
    "Neuroscience",
    "Nursing",
    "Nutrition",
    "Philosophy",
    "Physics",
    "Political Science",
    "Psychology",
    "Public Health",
    "Religious Studies",
    "Sociology",
    "Software Engineering",
    "Statistics",
    "Theatre",
    "Veterinary Science",
    "Zoology",
  ];
  const sendMessage = async () => {
    if (message.trim()) {
      setMessages((messages) => [
        ...messages,
        { role: "user", content: message },
        { role: "assistant", content: "" },
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

        let result = "";
        return reader.read().then(function processText({ done, value }) {
          if (done) {
            return result;
          }
          const text = decoder.decode(value || new Uint8Array(), {
            stream: true,
          });
          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1];
            let otherMessages = messages.slice(0, messages.length - 1);
            return [
              ...otherMessages,
              { ...lastMessage, content: lastMessage.content + text },
            ];
          });
          return reader.read().then(processText);
        });
      });
    }
  };

  const handleScrape = async () => {
    if (url.trim()) {
      try {
        const response = await fetch("/api/scraping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message);
        } else {
          alert("Failed to scrape the page.");
        }
      } catch (error) {
        console.error(error);
        alert("An error occurred during scraping.");
      }
    } else {
      alert("Please enter a valid URL.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuery = async () => {
    if (field.trim() && school.trim() && top.trim()) {
      setMessages((messages) => [
        ...messages,
        {
          role: "user",
          content: `Recommend me ${top} professors in ${field} at ${school}...`,
        },
        { role: "assistant", content: "" },
      ]);

      setFilteredMessage("");
      const response = fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ...messages,
          { role: "user", content: message, top, field, school},
        ]
      ),
      }).then(async (res) => {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let result = "";
        return reader.read().then(function processText({ done, value }) {
          if (done) {
            return result;
          }
          const text = decoder.decode(value || new Uint8Array(), {
            stream: true,
          });
          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1];
            let otherMessages = messages.slice(0, messages.length - 1);
            return [
              ...otherMessages,
              { ...lastMessage, content: lastMessage.content + text },
            ];
          });
          return reader.read().then(processText);
        });
      });
    } else {
      alert("Please enter valid values for the query.");
    }
  };

  const handleToggleQuery = async () => {
    setToggleQuery(!toggleQuery);
  };

  return (
    <div className="w-[80%] m-auto">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f0f4f8",
          padding: 2,
        }}
      >
        <Typography variant="h4" sx={{ textAlign: "center", mb: 2 }}>
          AI Rate My Professor
        </Typography>
        <Paper
          elevation={3}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 2,
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            width: "80%",
            maxWidth: "600px",
            height: "80vh",
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              padding: 2,
              marginBottom: "8px",
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                  mb: 1,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    padding: "8px 12px",
                    borderRadius: "12px",
                    backgroundColor:
                      message.role === "user" ? "#007aff" : "#e0e0e0",
                    color: message.role === "user" ? "#ffffff" : "#000000",
                    maxWidth: "60%",
                  }}
                >
                  {message.content}
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#f0f4f8",
              borderRadius: "20px",
              padding: "8px",
              marginTop: "auto",
            }}
          >
            <TextField
              fullWidth
              placeholder="Type your message..."
              variant="outlined"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                backgroundColor: "#f0f4f8",
                borderRadius: "20px",
                marginRight: 1,
                "& fieldset": { border: "none" },
              }}
            />
            <IconButton
              onClick={handleToggleQuery}
              sx={{
                backgroundColor: "#007bff",
                color: "#ffffff",
                borderRadius: "50%",
                padding: "10px",
              }}
            >
              <SearchOutlinedIcon />
            </IconButton>
            <IconButton
              onClick={sendMessage}
              sx={{
                backgroundColor: "#007bff",
                color: "#ffffff",
                borderRadius: "50%",
                padding: "10px",
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          <div
            className={`${
              toggleQuery ? "block" : "hidden"
            } flex gap-[2vh] py-[1vh]`}
          >
            <Autocomplete
              sx={{ width: "100%" }}
              freeSolo={true}
              options={subjects}
              value={field}
              onChange={(event, newValue) => {
                setField(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Academic Field"
                  placeholder="Type or select a field"
                  variant="outlined"
                  fullWidth
                  onChange={(e) => {
                    setField(e.target.value);
                  }}
                  sx={{
                    backgroundColor: "#f0f4f8",
                    borderRadius: "20px",
                    "& fieldset": { border: "none" },
                  }}
                />
              )}
            />
            <TextField
              fullWidth
              placeholder="School"
              variant="outlined"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              sx={{
                backgroundColor: "#f0f4f8",
                borderRadius: "20px",
                "& fieldset": { border: "none" },
              }}
            />
            <TextField
              fullWidth
              placeholder="Top x Professors"
              variant="outlined"
              value={top}
              onChange={(e) => setTop(e.target.value)}
              sx={{
                backgroundColor: "#f0f4f8",
                borderRadius: "20px",
                "& fieldset": { border: "none" },
              }}
            />
            <Button
              variant="contained"
              onClick={handleQuery}
              sx={{
                backgroundColor: "#007bff",
                color: "#ffffff",
                borderRadius: "20px",
                padding: "10px",
              }}
            >
              Query
            </Button>
          </div>
        </Paper>
        <div className="flex py-[1vh] w-[40%] gap-[2vh]">
          <TextField
            fullWidth
            placeholder="Enter Rate My Professor URL..."
            variant="outlined"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              "& fieldset": { border: "none" },
            }}
          />
          <Button
            variant="contained"
            onClick={handleScrape}
            sx={{
              backgroundColor: "#007bff",
              color: "#ffffff",
              borderRadius: "20px",
            }}
          >
            Scrape
          </Button>
        </div>
      </Box>
    </div>
  );
}
