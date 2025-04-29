import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Define markdown styles once and reuse
export const markdownStyles = {
  p: "my-2",
  h1: "text-2xl font-bold my-4",
  h2: "text-xl font-bold my-3",
  h3: "text-lg font-bold my-2",
  h4: "text-base font-bold my-2",
  h5: "text-sm font-bold my-1",
  h6: "text-xs font-bold my-1",
  ul: "list-disc pl-5 my-2",
  ol: "list-decimal pl-5 my-2",
  li: "my-1",
  a: "text-blue-500 hover:underline",
  blockquote: "border-l-4 border-gray-300 pl-4 italic my-2",
  code: "font-mono text-sm bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5",
  pre: "bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto my-3 font-mono text-sm",
  hr: "border-t my-4",
  table: "min-w-full divide-y divide-gray-200 my-4",
  th: "px-3 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
  td: "px-3 py-1 whitespace-nowrap",
  img: "max-w-full h-auto my-3 rounded-md",
  strong: "font-bold",
  em: "italic",
};

export function MarkdownRenderer({ children, className = "" }) {
  const markdownComponents = {
    p: ({ node, ...props }) => <p className={markdownStyles.p} {...props} />,
    h1: ({ node, ...props }) => <h1 className={markdownStyles.h1} {...props} />,
    h2: ({ node, ...props }) => <h2 className={markdownStyles.h2} {...props} />,
    h3: ({ node, ...props }) => <h3 className={markdownStyles.h3} {...props} />,
    h4: ({ node, ...props }) => <h4 className={markdownStyles.h4} {...props} />,
    h5: ({ node, ...props }) => <h5 className={markdownStyles.h5} {...props} />,
    h6: ({ node, ...props }) => <h6 className={markdownStyles.h6} {...props} />,
    ul: ({ node, ...props }) => <ul className={markdownStyles.ul} {...props} />,
    ol: ({ node, ...props }) => <ol className={markdownStyles.ol} {...props} />,
    li: ({ node, ...props }) => <li className={markdownStyles.li} {...props} />,
    a: ({ node, ...props }) => (
      <a
        className={markdownStyles.a}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className={markdownStyles.blockquote} {...props} />
    ),
    code: ({ node, inline, className, children, ...props }: any) =>
      inline ? (
        <code className={markdownStyles.code} {...props}>
          {children}
        </code>
      ) : (
        <code className={markdownStyles.code} {...props}>
          {children}
        </code>
      ),
    pre: ({ node, ...props }) => (
      <pre className={markdownStyles.pre} {...props} />
    ),
    hr: ({ node, ...props }) => <hr className={markdownStyles.hr} {...props} />,
    table: ({ node, ...props }) => (
      <table className={markdownStyles.table} {...props} />
    ),
    th: ({ node, ...props }) => <th className={markdownStyles.th} {...props} />,
    td: ({ node, ...props }) => <td className={markdownStyles.td} {...props} />,
    img: ({ node, ...props }) => (
      <img className={markdownStyles.img} {...props} />
    ),
    strong: ({ node, ...props }) => (
      <strong className={markdownStyles.strong} {...props} />
    ),
    em: ({ node, ...props }) => <em className={markdownStyles.em} {...props} />,
  };

  return (
    <div className={`whitespace-pre-wrap text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
