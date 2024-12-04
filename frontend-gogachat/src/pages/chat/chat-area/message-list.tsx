import { Message } from "./message";

export const MessageList = ({ messages }: { messages: Array<{ id: number; sender?: string; text: string; isMine: boolean }> }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages && messages.length > 0 ? (
        messages.map((message) => (
          <Message key={message.id} {...message} />
        ))
      ) : (
        <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
      )}
    </div>
  );
};
