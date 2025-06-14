import {
  logger,
  type Character,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
} from '@elizaos/core';
import character, { initCharacter } from './character.ts';

export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  // plugins: [starterPlugin], <-- Import custom plugins here
};
const project: Project = {
  agents: [projectAgent],
};

export default project;
