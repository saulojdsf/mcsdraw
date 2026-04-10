import { createContext } from 'react';

/** Called by nodes (e.g. ModuleNode's edit button) to open the edit modal */
export const NodeEditContext = createContext<(nodeId: string) => void>(() => {});
