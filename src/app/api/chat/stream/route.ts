import { auth } from "@clerk/nextjs/server";
import { ChatRequestBody, StreamMessage, StreamMessageType, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, SSE_DONE_MESSAGE } from "@/lib/types";
import { getConvexClient } from "@/lib/convex";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";


function sendSSEMessage(writer: WritableStreamDefaultWriter<Uint8Array>, data: StreamMessage){
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  )
}

export async function POST(req: Request){
  try{
    const { userId } = await auth();
    if(!userId){
      return new Response("Unauthorized", {status: 401});
    }

    const { messages, newMessage, chatId } = (await req.json()) as ChatRequestBody;

    const convex = getConvexClient();

    //Create Stream
    const stream = new TransformStream({}, {highWaterMark: 1024});
    const writer = stream.writable.getWriter();

    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

    const startStream = async ()=>{
      try{
        //Stream will be implemented here
        //Send initial message to establish connection
        await sendSSEMessage(writer, {type: StreamMessageType.Connected});

        //Send user message to convex
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        })

      } catch(error){
        console.error("Error in chat API",error);
        return NextResponse.json(
          {error: "Failed to get response from chat API"} as const,
          {status: 500}
        )
      }
    }
    
    startStream();

    return response;

  } catch(error){
    console.error(error);
    return NextResponse.json(
      {error: "Something went wrong"} as const,
      {status: 500}
    )

  }
}