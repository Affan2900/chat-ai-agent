import { auth } from "@clerk/nextjs/server";
import { ChatRequestBody, StreamMessage, StreamMessageType, SSE_DATA_PREFIX, SSE_LINE_DELIMITER } from "@/lib/types";
import { getConvexClient } from "@/lib/convex";
import { NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { submitQuestion } from "@/lib/langgraph";


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

    (async ()=>{
      try{
        //Stream will be implemented here
        //Send initial message to establish connection
        await sendSSEMessage(writer, {type: StreamMessageType.Connected});

        //Send user message to convex
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        })

        //Convert messages to LangChain format
        const langChainMessages = [
          ...messages.map((msg)=>
          msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage)
        ];

        try{
          //Create the stream
          const eventStream = await submitQuestion(langChainMessages, chatId);

          //Process the events
          for await (const event of eventStream) {
            if (event.event === "on_chat_model_stream"){
              const token = event.data.chunk;
              if (token){
                //Access the text property of AIMessageChunk
                const text = token.content.at(0)?.["text"];
                if (text){
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text
                  })
                }
              }
            } else if (event.event === "on_tool_start"){
              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name || "Unknown Tool",
                input: event.data.input
              })
            } else if (event.event === "on_tool_end"){
              const toolMessage = new ToolMessage(event.data.output);

              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: toolMessage.lc_kwargs.name || "Unknown Tool",
                output: event.data.output
              })
            }
          }
        //Send completion message
        await sendSSEMessage(writer, { type: StreamMessageType.Done });
        } catch(streamError){
            console.log("Error in event stream", streamError);
            await sendSSEMessage(writer, {
              type: StreamMessageType.Error,
              error:
                streamError instanceof Error
                ? streamError.message
                : "Stream processing failed"
            })
        }

      } catch(error){
        console.error("Error in stream",error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: error instanceof Error ? error.message : "Unknown Error"
        })
      } finally {
        try{
          await writer.close();
        } catch(closeError){
          console.error("Error closing writer", closeError);
        }
      }
    })();
    
    // startStream();

    return response;

  } catch(error){
    console.error(error);
    return NextResponse.json(
      {error: "Something went wrong"} as const,
      {status: 500}
    )

  }
}