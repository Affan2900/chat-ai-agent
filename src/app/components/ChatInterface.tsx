'use client'

import { Doc, Id } from "../../../convex/_generated/dataModel";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ChatRequestBody } from "@/lib/types";
import { createSSEParser } from "@/lib/createSSEParser";
import { StreamMessageType } from "@/lib/types"; 
import { getConvexClient } from "@/lib/convex";
import { api } from "../../../convex/_generated/api";
import MessageBubble from "./MessageBubble";

interface ChatInterfaceProps{
  chatId: Id<"chats">;
  initialMessages: Doc<"messages">[];
}

function ChatInterface({ chatId,initialMessages }: ChatInterfaceProps) {

  const [messages, setMessages] = useState<Doc<"messages">[]>(initialMessages)
  const [input,setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState("");
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown
  } | null>(null);

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (chunk: string) => Promise<void>
  ) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        await onChunk(new TextDecoder().decode(value));
      }
    } finally {
      reader.releaseLock();
    }
  };
  //To scroll to buttom every time we type messages
  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    messageEndRef.current?.scrollIntoView({behavior: "smooth"})
  }, [messages, streamedResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
  
    setInput("");
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);
  
    // Add Optimistic message
    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;
  
    setMessages((prev) => [...prev, optimisticUserMessage]);
  
    let fullResponse = "";
  
    // Start Streaming response
    try {
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          content: msg.content,
          role: msg.role,
        })),
        newMessage: trimmedInput,
        chatId,
      };
  
      console.log("Sending request to LLM with body:", requestBody);
  
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      console.log("Response from LLM:", response);
  
      if (!response.ok) {
        throw new Error(await response.text());
      }
      if (!response.body) {
        throw new Error("No response body");
      }
  
      // Handle the Stream
      // Create SSE render and stream parser
      const parser = createSSEParser();
      const reader = response.body.getReader();
  
      // Process the stream chunks
      await processStream(reader, async (chunk) => {
        // Parse messages from chunk
        const messages = parser.parse(chunk);
        console.log("Messages from LLM:", messages);
        for (const message of messages) {
          switch (message.type) {
            case StreamMessageType.Token:
              if ("token" in message) {
                fullResponse += message.token;
                setStreamedResponse(fullResponse);
                console.log("Streamed response:", fullResponse);
              }
              break;
  
            case StreamMessageType.Error:
              if ("error" in message) {
                throw new Error(message.error);
              }
              break;
  
            case StreamMessageType.Done:
              const assistantMessage: Doc<"messages"> = {
                _id: `temp_assistant_${Date.now()}`,
                chatId,
                content: fullResponse,
                role: "assistant",
                createdAt: Date.now(),
              } as Doc<"messages">;
  
              // Save message to database
              const convex = getConvexClient();
              await convex.mutation(api.messages.store, {
                chatId,
                content: fullResponse,
                role: "assistant",
              });
  
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamedResponse("");
              console.log("Final response:", fullResponse);
              return;
          }
        }
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((msg) => msg._id !== optimisticUserMessage._id));
      setStreamedResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
      {/* Messages */}
      <section className="flex-1 overflow-y-auto p-2 bg-gray-50 md:p-0">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {/*Messages */}
          {messages.map((message: Doc<"messages">) => (
            <MessageBubble
              key={message._id}
              content={message.content}
              isUser={message.role === "user"}
            />
          ))}

          { streamedResponse && <MessageBubble content={streamedResponse}/> }

          {isLoading && !streamedResponse && (
  <div className="flex justify-start animate-in fade-in-0">
    <div className="rounded-2xl px-4 py-3 bg-white text-gray-900 rounded-bl-none shadow-sm ring-1 ring-inset ring-gray-200">
      <div className="flex items-center gap-1.5">
        {[0.3, 0.15, 0].map((delay, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `-${delay}s` }}
          />
        ))}
      </div>
    </div>
  </div>
)}

        {/* Last Message */}
        <div ref={messageEndRef}/>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-white p-5">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e)=>setInput(e.target.value)}
              placeholder="Type your message here.."
              className="flex-1 py-3 px-4 rounded border border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-12 bg-gray-50 placeholder:text-gray-400"
              disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`absolute right-1.5 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-all ${
                  input.trim()
                    ? "bg-teal-500 text-white shadow-sm hover:bg-teal-600"
                    : "bg-gray-100 text-gray-400"
                }` }
              >
                <ArrowRight/>
              </Button>
          </div>
        </form>
      </footer>
    </main>
  )
}

export default ChatInterface