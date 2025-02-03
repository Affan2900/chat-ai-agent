'use client'

import { Doc, Id } from "../../../convex/_generated/dataModel";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ChatRequestBody } from "@/lib/types";

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
  //To scroll to buttom every time we type messages
  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    messageEndRef.current?.scrollIntoView({behavior: "smooth"})
  }, [messages, streamedResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if(!trimmedInput || isLoading) return;
    
    setInput("");
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);

    //Add Optimistic message
    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;
    
    setMessages((prev)=> [...prev, optimisticUserMessage])

    let fullResponse = "";

    //Start Streaming response
    try{
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg)=> ({
          content: msg.content,
          role: msg.role
        })),
        newMessage: trimmedInput,
        chatId,
      }

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      if(!response.ok){
        throw new Error(await response.text());
      }
      if(!response.body){
        throw new Error("No response body");
      }

      //Handle the Stream
    } catch(error){
        console.error(error);
        setMessages((prev)=> prev.filter((msg)=>msg._id !== optimisticUserMessage._id))
        setStreamedResponse(
          "error"
        )
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-col h-[calc(100vh-theme(spacing.14))]">
      {/* Messages */}
      <section className="flex-1">
        <div>
          {/*Messages */}
          {messages.map((message) => (
            <div key={message._id}>{message.content}</div>
          ))}

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