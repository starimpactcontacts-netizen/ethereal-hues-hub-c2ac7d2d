import { useNavigate } from "react-router-dom";
import { Fragment, useMemo } from "react";

interface RichMessageContentProps {
  content: string;
}

// Regex patterns
const GIF_PATTERN = /https?:\/\/[^\s]+\.gif(\?[^\s]*)?/gi;
const MENTION_PATTERN = /@(\w+)/g;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export default function RichMessageContent({ content }: RichMessageContentProps) {
  const navigate = useNavigate();

  const parsedContent = useMemo(() => {
    const elements: JSX.Element[] = [];
    let lastIndex = 0;
    let key = 0;

    // Check if the entire message is just a GIF URL
    const trimmed = content.trim();
    if (GIF_PATTERN.test(trimmed) && !trimmed.includes(" ")) {
      return [
        <img
          key="gif"
          src={trimmed}
          alt="GIF"
          className="max-w-[250px] max-h-[200px] rounded-lg mt-1"
          loading="lazy"
        />
      ];
    }

    // Reset regex
    GIF_PATTERN.lastIndex = 0;

    // Combined pattern to match mentions, GIFs, or URLs
    const combinedPattern = /(@\w+)|(https?:\/\/[^\s]+\.gif(?:\?[^\s]*)?)|(https?:\/\/[^\s]+)/gi;
    
    let match;
    while ((match = combinedPattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(
          <Fragment key={key++}>
            {content.slice(lastIndex, match.index)}
          </Fragment>
        );
      }

      if (match[1]) {
        // Mention
        const username = match[1].slice(1); // Remove @
        elements.push(
          <button
            key={key++}
            onClick={() => navigate(`/u/${username}`)}
            className="text-primary font-medium hover:underline"
          >
            @{username}
          </button>
        );
      } else if (match[2]) {
        // GIF URL - render inline
        elements.push(
          <img
            key={key++}
            src={match[2]}
            alt="GIF"
            className="max-w-[250px] max-h-[200px] rounded-lg mt-1 block"
            loading="lazy"
          />
        );
      } else if (match[3]) {
        // Regular URL - make it a link
        elements.push(
          <a
            key={key++}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {match[3].length > 50 ? match[3].slice(0, 50) + "..." : match[3]}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <Fragment key={key++}>
          {content.slice(lastIndex)}
        </Fragment>
      );
    }

    return elements;
  }, [content, navigate]);

  return <>{parsedContent}</>;
}
