import { registerEnumType } from "type-graphql";

export enum MessageRole {
  user = "user",
  assistant = "assistant",
  system = "system",
}

export enum ActionExecutionScope {
  server = "server",
  client = "client",
}

export enum MessageInputUnionType {
  textMessage = "textMessage",
  actionExecutionMessage = "actionExecutionMessage",
  resultMessage = "resultMessage",
}

registerEnumType(MessageRole, {
  name: "MessageRole",
  description: "The role of the message",
});

registerEnumType(ActionExecutionScope, {
  name: "ActionExecutionScope",
  description: "The scope of the action",
});

registerEnumType(MessageInputUnionType, {
  name: "MessageInputUnionType",
  description: "The type of the message",
});
