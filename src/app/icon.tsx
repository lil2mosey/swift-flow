
import { ImageResponse } from 'next/og';

/**
 * Dynamic Brand Icon Generator for SwiftFlow.
 * Resolves the "Processing image failed" error by generating a high-fidelity icon from code.
 * This is the modern Next.js standard for favicons/icons.
 */

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2dd4bf',
          borderRadius: '20%',
          border: '2px solid #2dd4bf',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 32C50 32 38 37 38 48V60C38 68 44 72 50 72C56 72 62 68 62 60V48C62 37 50 32 50 32Z"
            stroke="#2dd4bf"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path
            d="M44 56L48 60L56 51"
            stroke="#2dd4bf"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
