type Props = {
  children: string;
};

export const CodeInline = ({ children }: Props) => {
  return <span className="bg-gray-950 text-gray-300 rounded px-1 py-0.5 text-xxs">{children}</span>;
};
