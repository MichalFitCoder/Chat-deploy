export const ChatHeader = ({ chatName }: { chatName: string }) => {
    return (
      <div className="flex items-center px-6 py-3 border-b bg-white">
        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
        <div>
          <div className="font-medium">{chatName}</div>
          <div className="text-sm text-green-500">Online</div>
        </div>
      </div>
    );
  };