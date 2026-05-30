import { useNavigate } from "react-router-dom";
import { Fragment, useMemo } from "react";
import LinkPreview from "./LinkPreview";

interface RichMessageContentProps {
  content: string;
  showLinkPreviews?: boolean;
}

// Regex patterns
const GIF_PATTERN = /https?:\/\/[^\s]+\.gif(\?[^\s]*)?/gi;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

const IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)(\?|$)/i;
const VIDEO_PATTERN = /\.(mp4|webm|mov)(\?|$)/i;

function isImageUrl(url: string) {
  return IMAGE_PATTERN.test(url) || url.includes('.supabase.co/storage');
}
function isVideoUrl(url: string) {
  return VIDEO_PATTERN.test(url);
}

// Domains to skip previews for (already handled or not useful)
const SKIP_PREVIEW_DOMAINS = [
  'tenor.com',
  'giphy.com',
  'media.tenor.com',
  'media.giphy.com',
];

function shouldShowPreview(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Skip GIFs
    if (parsed.pathname.endsWith('.gif')) return false;
    // Skip known GIF domains
    if (SKIP_PREVIEW_DOMAINS.some(d => parsed.hostname.includes(d))) return false;
    return true;
  } catch {
    return false;
  }
}

export default function RichMessageContent({ content, showLinkPreviews = true }: RichMessageContentProps) {
  const navigate = useNavigate();

  const { elements, previewUrls } = useMemo(() => {
    const elements: JSX.Element[] = [];
    const previewUrls: string[] = [];
    let lastIndex = 0;
    let key = 0;

    // Check if the entire message is a single media URL
    const trimmed = content.trim();
    if (!trimmed.includes(" ")) {
      if (isVideoUrl(trimmed)) {
        return {
          elements: [
            <video
              key="video"
              src={trimmed}
              controls
              className="max-w-[260px] max-h-[200px] rounded-lg mt-1"
              preload="metadata"
            />
          ],
          previewUrls: []
        };
      }
      GIF_PATTERN.lastIndex = 0;
      if (GIF_PATTERN.test(trimmed) || isImageUrl(trimmed)) {
        return {
          elements: [
            <img
              key="img"
              src={trimmed}
              alt=""
              className="max-w-[260px] max-h-[200px] rounded-lg mt-1 object-cover"
              loading="lazy"
            />
          ],
          previewUrls: []
        };
      }
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
        // GIF URL - render inline - compact for mobile
        elements.push(
          <img
            key={key++}
            src={match[2]}
            alt="GIF"
            className="max-w-[180px] max-h-[140px] rounded-lg mt-1 block"
            loading="lazy"
          />
        );
      } else if (match[3]) {
        const urlText = match[3];
        if (isVideoUrl(urlText)) {
          elements.push(
            <video key={key++} src={urlText} controls className="max-w-[260px] max-h-[200px] rounded-lg mt-1 block" preload="metadata" />
          );
        } else if (isImageUrl(urlText)) {
          elements.push(
            <img key={key++} src={urlText} alt="" className="max-w-[260px] max-h-[200px] rounded-lg mt-1 block object-cover" loading="lazy" />
          );
        } else {
          elements.push(
            <a
              key={key++}
              href={urlText}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {urlText.length > 50 ? urlText.slice(0, 50) + "..." : urlText}
            </a>
          );
          if (showLinkPreviews && previewUrls.length === 0 && shouldShowPreview(urlText)) {
            previewUrls.push(urlText);
          }
        }
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

    return { elements, previewUrls };
  }, [content, navigate, showLinkPreviews]);

  return (
    <div>
      <span>{elements}</span>
      {previewUrls.map((url) => (
        <LinkPreview key={url} url={url} />
      ))}
    </div>
  );
}
