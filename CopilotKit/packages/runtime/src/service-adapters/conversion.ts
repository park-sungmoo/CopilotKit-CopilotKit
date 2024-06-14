import { ActionExecutionMessage, Message, ResultMessage, TextMessage } from "@copilotkit/shared";
import { MessageInput } from "../graphql/inputs/message.input";
import { MessageInputUnionType } from "../graphql/types/enums";
import assert from "assert";

export function convertGqlInputToMessages(inputMessages: MessageInput[]): Message[] {
  const messages: Message[] = [];

  for (const message of inputMessages) {
    switch (message.union.type) {
      case MessageInputUnionType.textMessage:
        assert(message.union.textMessage);
        messages.push(
          new TextMessage({
            id: message.id,
            createdAt: message.createdAt,
            role: message.union.textMessage.role,
            content: message.union.textMessage.content,
          }),
        );
        break;

      case MessageInputUnionType.actionExecutionMessage:
        assert(message.union.actionExecutionMessage);
        messages.push(
          new ActionExecutionMessage({
            id: message.id,
            createdAt: message.createdAt,
            name: message.union.actionExecutionMessage.name,
            arguments: JSON.parse(message.union.actionExecutionMessage.arguments),
            scope: message.union.actionExecutionMessage.scope,
          }),
        );
        break;

      case MessageInputUnionType.resultMessage:
        assert(message.union.resultMessage);
        messages.push(
          new ResultMessage({
            id: message.id,
            createdAt: message.createdAt,
            actionExecutionId: message.union.resultMessage.actionExecutionId,
            actionName: message.union.resultMessage.actionName,
            result: message.union.resultMessage.result,
          }),
        );
        break;

      default:
        const exhaustiveCheck: never = message.union.type;
        throw new Error(`Unhandled type: ${exhaustiveCheck}`);
    }
  }

  return messages;
}
