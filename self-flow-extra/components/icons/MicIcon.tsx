
import React from 'react';

interface MicIconProps extends React.SVGProps<SVGSVGElement> {}

const MicIcon: React.FC<MicIconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
    <path d="M19 10v1a7 7 0 01-14 0v-1h-2v1a9 9 0 008 8.94V22h-3v2h8v-2h-3v-2.06A9 9 0 0021 11v-1h-2z" />
  </svg>
);

export default MicIcon;
