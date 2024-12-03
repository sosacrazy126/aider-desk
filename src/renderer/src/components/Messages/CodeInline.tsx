type Props = {
  children: string;
};

export const CodeInline = ({ children }: Props) => {
  return <span className="bg-gray-950 text-white rounded-sm px-1.5 py-0.5 text-xxs font-semibold">{children}</span>;
};
