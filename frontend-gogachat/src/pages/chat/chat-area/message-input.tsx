import { Paperclip, Send, Smile, Image } from "lucide-react";

export const MessageInput = () => {
    return (
      <div className="px-4 py-3 bg-white border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Write Something..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-lg focus:outline-none"
          />
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Image className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Smile className="w-5 h-5 text-gray-500" />
          </button>
          <button className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  };