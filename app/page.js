"use client";
import { useState, useRef, useEffect } from "react";
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
  const [url, setUrl] = useState("");
  const [field, setField] = useState("");
  const [school, setSchool] = useState("");
  const [top, setTop] = useState("");
  const [toggleQuery, setToggleQuery] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [courseNumber, setCourseNumber] = useState('')

  const messagesEndRef = useRef(null);

  const subjects = [
    "Accounting",
    "Aerospace Engineering",
    "Agricultural Science",
    "American Studies",
    "Anthropology",
    "Applied Mathematics",
    "Architecture",
    "Art History",
    "Astronomy",
    "Biochemistry",
    "Bioinformatics",
    "Biology",
    "Biomedical Engineering",
    "Biophysics",
    "Botany",
    "Business Administration",
    "Chemical Engineering",
    "Chemistry",
    "Child Development",
    "Civil Engineering",
    "Classical Studies",
    "Classics",
    "Cognitive Science",
    "Communications",
    "Comparative Literature",
    "Computer Engineering",
    "Computer Science",
    "Creative Writing",
    "Criminology",
    "Cultural Studies",
    "Data Science",
    "Dentistry",
    "Drama",
    "Ecology",
    "Economics",
    "Education",
    "Electrical Engineering",
    "Engineering Management",
    "English Language",
    "English Literature",
    "Environmental Engineering",
    "Environmental Science",
    "Epidemiology",
    "Ethics",
    "Film Studies",
    "Finance",
    "Fine Arts",
    "Food Science",
    "Forestry",
    "Genetics",
    "Geography",
    "Geology",
    "Graphic Design",
    "Health Administration",
    "History",
    "Hospitality Management",
    "Human Resources",
    "Humanities",
    "Industrial Engineering",
    "Information Systems",
    "Information Technology",
    "International Business",
    "International Relations",
    "Journalism",
    "Kinesiology",
    "Landscape Architecture",
    "Languages",
    "Law",
    "Linguistics",
    "Literature",
    "Logistics",
    "Management",
    "Marine Biology",
    "Marketing",
    "Materials Science",
    "Mathematics",
    "Mechanical Engineering",
    "Media Studies",
    "Medicine",
    "Meteorology",
    "Microbiology",
    "Military Science",
    "Molecular Biology",
    "Music",
    "Nanotechnology",
    "Neuroscience",
    "Nursing",
    "Nutrition",
    "Occupational Therapy",
    "Oceanography",
    "Operations Management",
    "Optometry",
    "Paleontology",
    "Pharmacology",
    "Philosophy",
    "Physical Education",
    "Physics",
    "Physiology",
    "Political Science",
    "Psychiatry",
    "Psychology",
    "Public Administration",
    "Public Health",
    "Public Policy",
    "Religious Studies",
    "Robotics",
    "Social Work",
    "Sociology",
    "Software Engineering",
    "Spanish",
    "Sports Management",
    "Statistics",
    "Supply Chain Management",
    "Sustainability Studies",
    "Theatre",
    "Theology",
    "Urban Planning",
    "Veterinary Science",
    "Visual Arts",
    "Wildlife Conservation",
    "Women's Studies",
    "Zoology"
  ]
  
  const sendMessage = async () => {
    if (message.trim()) {
      setMessages((messages) => [
        ...messages,
        { role: "user", content: message },
        { role: "assistant", content: "" },
      ]);

      setMessage("");
      const response = fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
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
      scrollToBottom();
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuery = async () => {
    let queryMessage = "";

    if (top == ""){
      setTop(1)
    }

    if (field.trim() && school.trim() && courseNumber.trim()) {
      queryMessage = `Recommend me the top ${top} professors in ${field} at ${school} that teach ${courseNumber}`;
    } else if (field.trim() && school.trim()) {
      queryMessage = `Recommend me the top ${top} professors in ${field} at ${school}`;
    } else if (field.trim() && courseNumber.trim()) {
      queryMessage = `Recommend me the top ${top} professors in ${field} that teach ${courseNumber}`;
    } else if (school.trim() && courseNumber.trim()) {
      queryMessage = `Recommend me the top ${top} professors at ${school} that teach ${courseNumber}`;
    } else if (field.trim()) {
      queryMessage = `Recommend me the top ${top} professors in ${field}`;
    } else if (school.trim()) {
      queryMessage = `Recommend me the top ${top} professors at ${school}`;
    } else if (courseNumber.trim()) {
      queryMessage = `Recommend me the top ${top} professors that teach ${courseNumber}`;
    } else {
      alert("Please fill out at least one field.");
      return;
    }
  
      setMessages((messages) => [
        ...messages,
        {
          role: "user",
          content: queryMessage,
        },
        { role: "assistant", content: "" },
      ]);
  
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            ...messages,
            { role: "user", content: queryMessage },
          ]),
        });
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
  
        let result = "";
        reader.read().then(function processText({ done, value }) {
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
      } catch (error) {
        console.error("Error during query:", error);
      }
      setCourseNumber("")
      setField("")
      setInputValue("")
      setSchool("")
      setTop("")
  };
  

  const handleToggleQuery = async () => {
    setToggleQuery(!toggleQuery);
  };

  return (
    <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f0f4f8",
      padding: 3,
    }}
  >
    <Typography variant="h3" sx={{ textAlign: "center", mb: 3, fontWeight: 'bold', color: '#007bff' }}>
      AI Rate My Professor
    </Typography>
    <Paper
      elevation={4}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 3,
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        width: "80%",
        maxWidth: "600px",
        height: "75vh",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          padding: 2,
          mb: 2,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#007bff",
            borderRadius: "10px",
          },
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              mb: 1,
            }}
          >
            <Paper
              elevation={2}
              sx={{
                padding: "10px 15px",
                borderRadius: "15px",
                backgroundColor: message.role === "user" ? "#007aff" : "#e0e0e0",
                color: message.role === "user" ? "#ffffff" : "#000000",
                maxWidth: "70%",
                wordWrap: "break-word",
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
          borderRadius: "20px",
          padding: "10px",
          mt: "auto",
          border: "1px solid black"
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
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            mr: 1,
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
            ml: 1,
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
            ml: 1,
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
      <Box
        className={`${toggleQuery ? "block" : "hidden"} flex flex-col gap-3 py-2`}
        sx={{ mt: 2 }}
      >
        <Autocomplete
          sx={{ width: '100%' }}
          freeSolo
          options={subjects}
          value={field}
          onChange={(event, newValue) => {
            setField(newValue || '');
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
            setField(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Academic Field"
              placeholder="Type or select a field"
              variant="outlined"
              fullWidth
              sx={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                '& fieldset': { border: 'none' },
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
            backgroundColor: "#ffffff",
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
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            "& fieldset": { border: "none" },
          }}
        />
        <TextField
          fullWidth
          placeholder="Course #"
          variant="outlined"
          value={courseNumber}
          onChange={(e) => setCourseNumber(e.target.value)}
          sx={{
            backgroundColor: "#ffffff",
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
      </Box>
    </Paper>
    <Box sx={{ display: "flex", py: 2, width: "35%", gap: 2,}}>
      <TextField
        fullWidth
        placeholder="Enter Rate My Professor URL..."
        variant="outlined"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "80%",
          maxWidth: "600px",
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
          padding: "10px",
        }}
      >
        Scrape
      </Button>
    </Box>
  </Box>
  
  );
}
