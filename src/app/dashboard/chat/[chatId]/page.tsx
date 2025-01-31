import { Id } from "../../../../../convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConvexClient } from "@/lib/convex";
import { api } from "../../../../../convex/_generated/api";
import ChatInterface from "../../../components/ChatInterface";

interface ChatPageProps {
  params: Promise<{
    chatId: Id<"chats">
  }>;
}

async function ChatPage({params}: ChatPageProps) {
  //These are Server Side rendered
  const  { chatId } = await params;

  //Get User authentication -> because we on server, we have to user auth instead of useAuth
  const { userId } = await auth()
  if(!userId){
    redirect("/");
  }

  //Get convex client
  const convex = getConvexClient();

  //Get Messages
  const initialMessages = await convex.query(api.messages.list, {chatId})

  return (
    <div className="flex-1 overflow-hidden">
      <ChatInterface chatId={chatId} initialMessages={initialMessages} />

    </div>
  )
}

export default ChatPage;