export type TChat = {
  id: string;
  name: string;
  messages: Array<TMessages>;
};

export type TMessages = {
  id: number;
  sender?: string;
  text: string;
  isMine: boolean;
};
