import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type Chat = {
  id: string
  name: string
  messages: { role: "user" | "assistant"; content: string }[]
}

type SidebarProps = {
  chats: Chat[]
  currentChat: Chat | null
  onSelectChat: (chat: Chat) => void
  onNewChat: () => void
}

export function Sidebar({ chats, currentChat, onSelectChat, onNewChat }: SidebarProps) {
  return (
    <div className="w-64 bg-blue-900 border-r border-blue-200 flex flex-col shadow-lg">
      <div className="p-4">
        <Button onClick={onNewChat} className="w-full bg-teal-500 hover:bg-teal-600 text-white">
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {chats.map((chat) => (
          <Button
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`w-full justify-start px-4 py-2 text-left ${
              currentChat?.id === chat.id ? "bg-blue-100 text-blue-800" : "bg-white text-blue-600 hover:bg-blue-50"
            }`}
          >
            {chat.name}
          </Button>
        ))}
      </ScrollArea>
    </div>
  )
}

