import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { RunnableLike } from '@langchain/core/runnables';

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
});

export const createAgentGraph = (model: RunnableLike<BaseMessage[], BaseMessage>) => {
  const graph = new StateGraph(AgentState)
    .addNode('simulationTutorAgent', async (state: typeof AgentState.State) => {
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addEdge(START, 'simulationTutorAgent')
    .addEdge('simulationTutorAgent', END)
    .compile();

  return graph;
};

// TODO: Add mathematical tools.
// TODO: Add step-by-step resolution strategies.
// TODO: Add validation for missing data.
// TODO: Add automatic model type identification.
// TODO: Add conversation memory.
// TODO: Add streaming responses.
// TODO: Add dynamic strategy selection.
// TODO: Add multiple specialized nodes.
