'use client'

import { Doc, Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ChatInterfaceProps{
  chatId: Id<"chats">;
  initialMessages: Doc<"messages">[];
}

function ChatInterface({ chatId,initialMessages }: ChatInterfaceProps) {

  const [messages, setMessages] = useState<Doc<"messages">[]>(initialMessages)
  const [input,setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <main>
      {/* Messages */}
      <section>

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