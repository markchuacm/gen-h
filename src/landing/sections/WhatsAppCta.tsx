import { whatsappHref } from "../data";

export function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.35 2.13 11.7c0 1.88.56 3.7 1.61 5.26L2 22l5.2-1.64a10.1 10.1 0 0 0 4.84 1.24c5.46 0 9.91-4.35 9.91-9.7S17.5 2 12.04 2Zm0 17.95a8.4 8.4 0 0 1-4.29-1.18l-.3-.17-3.08.97 1-2.92-.2-.31a7.95 7.95 0 0 1-1.33-4.44c0-4.44 3.68-8.06 8.2-8.06 4.53 0 8.21 3.62 8.21 8.06 0 4.44-3.68 8.05-8.21 8.05Zm4.5-6.03c-.25-.12-1.46-.7-1.68-.78-.23-.08-.4-.12-.56.12-.16.24-.64.78-.78.94-.14.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.2-.74-.65-1.24-1.45-1.38-1.69-.14-.24-.02-.37.11-.49.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.32-.76-1.81-.2-.48-.41-.41-.56-.42h-.48c-.16 0-.42.06-.64.3-.22.24-.84.8-.84 1.95 0 1.15.86 2.26.98 2.42.12.16 1.7 2.53 4.11 3.54.57.24 1.02.39 1.37.5.58.18 1.1.15 1.51.09.46-.07 1.46-.58 1.66-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.47-.28Z"
      />
    </svg>
  );
}

export default function WhatsAppCta({
  children = "Book a consult",
  variant = "primary",
  onDark = false,
}: {
  children?: string;
  variant?: "primary" | "ghost";
  onDark?: boolean;
}) {
  return (
    <a
      className={`l-button l-button-${variant}${onDark ? " l-on-dark" : ""}`}
      href={whatsappHref}
      target="_blank"
      rel="noreferrer"
    >
      <span>{children}</span>
      <WhatsAppIcon />
    </a>
  );
}
