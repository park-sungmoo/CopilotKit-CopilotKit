import { nanoid } from "nanoid";
import { useCallback, useReducer } from "react";

export type TreeNodeId = string;

export interface TreeNode {
  id: TreeNodeId;
  value: string;
  children: TreeNode[];
  parentId?: TreeNodeId;
  categories: Set<string>;
  messages?: any[]; // Add this line
}

export type Tree = TreeNode[];

export interface UseTreeReturn {
  tree: Tree;
  addElement: (value: string, categories: string[], parentId?: TreeNodeId) => TreeNodeId;
  addMessageElement: (threadId: string, messages: any[]) => TreeNodeId;
  getMessagesElement: (threadId: string) => any[];
  printTree: (categories: string[]) => string;
  removeElement: (id: TreeNodeId) => void;
}

const findNode = (nodes: Tree, id: TreeNodeId): TreeNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const result = findNode(node.children, id);
    if (result) {
      return result;
    }
  }
  return undefined;
};

const findFromLocalStorage = (id: TreeNodeId) => {
  const nodesString = localStorage.getItem('treeState');
  if (!nodesString) return undefined;
  const nodes = JSON.parse(nodesString);
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
  }
  return undefined;
}

const removeNode = (nodes: Tree, id: TreeNodeId): Tree => {
  return nodes.reduce((result: Tree, node) => {
    if (node.id !== id) {
      const newNode = { ...node, children: removeNode(node.children, id) };
      result.push(newNode);
    }
    return result;
  }, []);
};

const addNode = (nodes: Tree, newNode: TreeNode, parentId?: TreeNodeId): Tree => {
  if (!parentId) {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newNode] };
    } else if (node.children.length) {
      return { ...node, children: addNode(node.children, newNode, parentId) };
    }
    return node;
  });
};

const addMessage = (nodes: Tree, threadId: string, messages: any[]): Tree => {
  let found = false;

  const updatedNodes = nodes.map((node) => {
    if (node.id === threadId) {
      found = true;
      return { ...node, messages: messages }; // Overwrite the existing messages array
    } else if (node.children.length) {
      const updatedChildren = addMessage(node.children, threadId, messages);
      return { ...node, children: updatedChildren };
    }
    return node;
  });

  if (!found) {
    const newNode: TreeNode = {
      id: threadId,
      value: "", // Assuming a default or empty value, adjust as necessary
      children: [],
      categories: new Set(), // Assuming an empty set, adjust as necessary
      messages: messages,
    };
    updatedNodes.push(newNode);
  }

  localStorage.setItem('treeState', JSON.stringify(updatedNodes));

  return updatedNodes;
};


const treeIndentationRepresentation = (index: number, indentLevel: number): string => {
  if (indentLevel === 0) {
    return (index + 1).toString();
  } else if (indentLevel === 1) {
    return String.fromCharCode(65 + index); // 65 is the ASCII value for 'A'
  } else if (indentLevel === 2) {
    return String.fromCharCode(97 + index); // 97 is the ASCII value for 'a'
  } else {
    return "-";
  }
};

const printNode = (node: TreeNode, prefix = "", indentLevel = 0): string => {
  const indent = " ".repeat(3).repeat(indentLevel);

  const prefixPlusIndentLength = prefix.length + indent.length;
  const subsequentLinesPrefix = " ".repeat(prefixPlusIndentLength);

  const valueLines = node.value.split("\n");

  const outputFirstLine = `${indent}${prefix}${valueLines[0]}`;
  const outputSubsequentLines = valueLines
    .slice(1)
    .map((line) => `${subsequentLinesPrefix}${line}`)
    .join("\n");

  let output = `${outputFirstLine}\n`;
  if (outputSubsequentLines) {
    output += `${outputSubsequentLines}\n`;
  }

  const childPrePrefix = " ".repeat(prefix.length);

  node.children.forEach(
    (child, index) =>
    (output += printNode(
      child,
      `${childPrePrefix}${treeIndentationRepresentation(index, indentLevel + 1)}. `,
      indentLevel + 1,
    )),
  );
  return output;
};

// Action types
type Action =
  | {
    type: "ADD_NODE";
    value: string;
    parentId?: string;
    id: string;
    categories: string[];
  }
  | { type: "REMOVE_NODE"; id: string }
  | { type: "ADD_MESSAGE"; threadId: string; messages: any[] }

// Reducer function
function treeReducer(state: Tree, action: Action): Tree {
  switch (action.type) {
    case "ADD_NODE": {
      const { value, parentId, id: newNodeId } = action;
      const newNode: TreeNode = {
        id: newNodeId,
        value,
        children: [],
        categories: new Set(action.categories),
      };

      try {
        return addNode(state, newNode, parentId);
      } catch (error) {
        console.error(`Error while adding node with id ${newNodeId}: ${error}`);
        return state;
      }
    }
    case "REMOVE_NODE":
      return removeNode(state, action.id);
    case "ADD_MESSAGE":
      return addMessage(state, action.threadId, action.messages);
    default:
      return state;
  }
}

// useTree hook
const useTree = (): UseTreeReturn => {
  const [tree, dispatch] = useReducer(treeReducer, []);

  const addElement = useCallback(
    (value: string, categories: string[], parentId?: string): TreeNodeId => {
      const newNodeId = nanoid(); // Generate new ID outside of dispatch
      dispatch({
        type: "ADD_NODE",
        value,
        parentId,
        id: newNodeId,
        categories: categories,
      });
      return newNodeId; // Return the new ID
    },
    [],
  );

  const addMessageElement = useCallback((threadId: string, messages: any[]): TreeNodeId => {
    const newNodeId = nanoid(); // Generate new ID outside of dispatch
    dispatch({ type: "ADD_MESSAGE", threadId, messages });
    return newNodeId; // Return the new ID
  }, []);

  const getMessagesElement = useCallback((threadId: string): any[] => {
    const node = findFromLocalStorage(threadId);
    return node?.messages || [];
  }, [tree]);

  const removeElement = useCallback((id: TreeNodeId): void => {
    dispatch({ type: "REMOVE_NODE", id });
  }, []);

  const printTree = useCallback(
    (categories: string[]): string => {
      const categoriesSet = new Set(categories);

      let output = "";
      tree.forEach((node, index) => {
        // if the node does not have any of the desired categories, continue to the next node
        if (!setsHaveIntersection(categoriesSet, node.categories)) {
          return;
        }

        // add a new line before each node except the first one
        if (index !== 0) {
          output += "\n";
        }

        output += printNode(node, `${treeIndentationRepresentation(index, 0)}. `);
      });
      return output;
    },
    [tree],
  );

  return { tree, addElement, printTree, removeElement, addMessageElement, getMessagesElement };
};

export default useTree;

function setsHaveIntersection<T>(setA: Set<T>, setB: Set<T>): boolean {
  const [smallerSet, largerSet] = setA.size <= setB.size ? [setA, setB] : [setB, setA];

  for (let item of smallerSet) {
    if (largerSet.has(item)) {
      return true;
    }
  }

  return false;
}
