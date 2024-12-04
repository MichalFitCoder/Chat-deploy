import { TChat } from "@/types/chat.types";

const mockMessages = [
  {
    id: 1,
    sender: "Alice",
    text: "Hi there! How are you?",
    isMine: false,
  },
  {
    id: 2,
    sender: undefined,
    text: "I'm good, thanks for asking!",
    isMine: true,
  },
];

export const getChats = async (userId: string): Promise<TChat[]> => {
  console.log("Fetching chats for user: ", userId);

  if (!userId) {
    throw new Error("User not logged in");
  }
  return [
    { id: "1", name: "Chat with Alice", messages: mockMessages },
    { id: "2", name: "Team Discussion", messages: mockMessages },
    { id: "3", name: "Project X", messages: mockMessages },
  ];
};

export const getChatById = async (userId: string, id: string): Promise<TChat | null> => {
  const chats = await getChats(userId);
  return chats.find((chat) => chat.id === id) || null;
};
