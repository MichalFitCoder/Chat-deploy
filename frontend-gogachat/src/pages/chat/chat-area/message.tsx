type TMessage = {
    text: string;
    isMine: boolean;
}


export const Message: React.FC<TMessage> = ({ text, isMine }) => {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[70%] rounded-lg px-4 py-2 ${
            isMine ? 'bg-blue-500 text-white' : 'bg-gray-100'
          }`}
        >
          {text}
        </div>
      </div>
    );
  };