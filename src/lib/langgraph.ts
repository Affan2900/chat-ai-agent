import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import { END, START, StateGraph, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import SYSTEM_MESSAGE  from "../../constants/systemMessage";
import { AIMessage, SystemMessage, trimMessages, BaseMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human"
})

//Connect to wxflows
const toolClient = new wxflows({
  endpoint: process.env.WXFLOWS_ENDPOINT || "",
  apikey: process.env.WXFLOWS_APIKEY,
})

//Retrieve the tools
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools)

const initialiseModel = () => {
  const model = new ChatTogetherAI({model: "mistralai/Mistral-7B-Instruct",
    apiKey: process.env.TOGETHERAI_API_KEY,
    maxTokens: 4096,
    temperature: 0.5,
    //Remeber streaming not supported
    streaming: true,
    callbacks: [
      {
        handleLLMStart: async()=>{

        },
        handleLLMEnd: async(output)=>{
          console.log("LLM end call",output);
          const usage = output.llmOutput?.usage;
          if(usage){

          }
        },
      }
    ]
  },
).bindTools(tools)

  return model;
}

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  //if LLM makes a tool call we redirect to the tool node
  if (lastMessage.tool_calls?.length){
    return "tools";
  }

  //If last message is a tool call then we return it back to the agent node
  if (lastMessage.content && lastMessage._getType() === "tool"){
    return "agent";
  }

  //Otherwise END
  return END;
}

//Create Workflow
const createWorkflow = () => {
  const model = initialiseModel();
  
  const stateGraph = new StateGraph(MessagesAnnotation)
       .addNode('agent', async (state) => {
          //Create a system message
          const systemContent = SYSTEM_MESSAGE;

          //Create a prompt template with system message and messages placeholder
          const promptTemplate = ChatPromptTemplate.fromMessages([
            new SystemMessage(systemContent),
            new MessagesPlaceholder("messages"),
          ]);

          const trimmedMessages = await trimmer.invoke(state.messages);

          //Format the promtp with the current messages
          const prompt = await promptTemplate.invoke({messages: trimmedMessages});

          //Get response from the model
          const response = await model.invoke(prompt);

          return { messages: [response] }
       })
       .addEdge(START, 'agent')
       .addNode("tools", toolNode)
       .addConditionalEdges("agent", shouldContinue)
       .addEdge("agent", "tools")

  return stateGraph;
}

function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  if(!messages.length){
    return messages;
  }

  const cachedMessages = [...messages];

  const addCache = (message: BaseMessage) => {
    message.content = [
      {
        type: "text",
        text: message.content as string,
        cache_control: { type: "ephemeral" },
      }
    ]
  }

}

export async function submitQuestion(messages: BaseMessage[], chatId: string){

  // Add caching headers to messages
  const cachedMessages = addCachingHeaders(messages){

  }

  const workflow = createWorkflow();
  

  //DO NOT KNOW IF THIS MEMORY SAVER WORKS WITHOUT PROMPT CACHING
  const checkpointer = new MemorySaver();

  //combine workflow with memory
  const app = workflow.compile({ checkpointer })

  // Run the graph and stream
  const stream = await app.streamEvents(
    {
      messages,
    },
    {
      version: 'v2',
      configurable: {
        thread_id: chatId,
      },
      streamMode: "messages",
      runId: chatId,
    }
  )

  return stream;
}