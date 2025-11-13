
import React from 'react';

interface InstagramIconProps extends React.SVGProps<SVGSVGElement> {}

const InstagramIcon: React.FC<InstagramIconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm6-2h-1.5v1.5H18V6zm-1.5-2H18v1.5h-1.5V4z" clipRule="evenodd" />
    <path d="M12 10a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);

export default InstagramIcon;
