// src/components/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import { TextField, Button, Container, Grid, LinearProgress, CircularProgress } from "@mui/material";
import Message from "./Message";
import OpenAI from "openai";
import { MessageDto } from "../models/MessageDto";
import SendIcon from "@mui/icons-material/Send";
import '../App.css';

const Chat: React.FC = () => {
  // const initResponses = [
  //   "Hello Jerry, how can I assist you?",
  //   "I understand. Can you confirm your date of birth please?",
  //   "Thank you Jerry, can you also confirm a good callback number?",
  //   "Thank you. What is a good pharmacy and phone number to send your refill to?",
  //   "Great. Someone from the office will be reaching out to handle your request. Thank you."
  // ];

  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>(new Array<MessageDto>());
  const [input, setInput] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [openai, setOpenai] = useState<any>(null);
  // ************************* REMOVE BELOW CODE BEFORE PUSHING TO PRODUCION
  // const [responses, setResponses] = useState<Array<string>>(initResponses);
  // const [aiResponse, setAiResponse] = useState<string>("");
  const chatWindowRef = useRef(null);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content: "Hello! How can I assist you today?",
        isUser: false,
      },
    ]);
  }, [assistant]);

  useEffect(() => {
    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages])

  const initChatBot = async () => {
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });


    // Retrieve an assistant
    const myAssistant = await openai.beta.assistants.retrieve(
      "asst_Sqm49eRQGJmrN042RAns5QnO"
    );
  
    // Create a thread
    const thread = await openai.beta.threads.create();
    // ************************* REMOVE BELOW CODE BEFORE PUSHING TO PRODUCION
    // const thread = [];
    // ****************************

    setOpenai(openai);
    setAssistant(myAssistant);
    setThread(thread);
  };

  const createNewMessage = (content: string, isUser: boolean) => {
    const newMessage = new MessageDto(isUser, content);
    return newMessage;
  };

  const handleSendMessage = async () => {
    messages.push(createNewMessage(input, true));
    setMessages([...messages]);
    setInput("");

    // Send a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: input,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // Create a response
    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    // Wait for the response to be ready
    while (response.status === "in_progress" || response.status === "queued") {
      setIsWaiting(true);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    setIsWaiting(false);
    
    // Get the messages for the thread
    const messageList = await openai.beta.threads.messages.list(thread.id);

    // Find the last message for the current run
    const lastMessage = messageList.data
      .filter((message: any) => message.run_id === run.id && message.role === "assistant")
      .pop();

    // Print the last message coming from the assistant
    if (lastMessage) {
      setMessages([...messages, createNewMessage(lastMessage.content[0]["text"].value, false)]);
    }

    // ************************* REMOVE BELOW CODE BEFORE PUSHING TO PRODUCION
    // simulate ai responses for demo purposes only
    // simulateAIResponse();
  };

  // detect enter key and send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // ************************* REMOVE BELOW CODE BEFORE PUSHING TO PRODUCION
  // simulate ai responses for demo purposes only
  // const simulateAIResponse = () => {
  //   let response = responses.shift();
  //   setResponses(responses);
  //   setAiResponse(response);
  //   messages.push(createNewMessage(response, false));
  //   setMessages([...messages]);
  // }

  return (
    <Container style={{ height: '90vh', position: 'relative' }}>
      <Grid ref={chatWindowRef} style={{ height: '80%', overflow: 'scroll', flexWrap: 'nowrap'  }} container direction="column" spacing={2} padding={2}>
        {messages.map((message, index) => (
          <Grid item alignSelf={message.isUser ? "flex-end" : "flex-start"} key={index}>
            <Message key={index} message={message} />
          </Grid>
        ))}
      </Grid>
      <Grid  style={{ position: 'absolute', bottom: '0' }} container direction="row" paddingBottom={5} paddingTop={2} justifyContent={"space-between"}>
        <Grid item sm={11} xs={9}>
          <TextField
            label="Type your message"
            variant="outlined"
            disabled={isWaiting}
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            />
          {isWaiting && <LinearProgress color="inherit" />}
        </Grid>
        <Grid item sm={1} xs={3}>
          <Button variant="contained" size="large" onClick={handleSendMessage} disabled={isWaiting}>
            {isWaiting && <CircularProgress color="inherit" />}
            {!isWaiting && <SendIcon fontSize="large" />}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Chat;
