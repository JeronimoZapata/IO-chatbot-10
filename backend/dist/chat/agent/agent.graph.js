"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraph = void 0;
const langgraph_1 = require("@langchain/langgraph");
const AgentState = langgraph_1.Annotation.Root({
    messages: (0, langgraph_1.Annotation)({
        reducer: (current, update) => current.concat(update),
        default: () => [],
    }),
});
const createAgentGraph = (model) => {
    const graph = new langgraph_1.StateGraph(AgentState)
        .addNode('simulationTutorAgent', async (state) => {
        const response = await model.invoke(state.messages);
        return { messages: [response] };
    })
        .addEdge(langgraph_1.START, 'simulationTutorAgent')
        .addEdge('simulationTutorAgent', langgraph_1.END)
        .compile();
    return graph;
};
exports.createAgentGraph = createAgentGraph;
//# sourceMappingURL=agent.graph.js.map