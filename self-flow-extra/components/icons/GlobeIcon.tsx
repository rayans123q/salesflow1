import React from 'react';

interface GlobeIconProps extends React.SVGProps<SVGSVGElement> {}

const GlobeIcon: React.FC<GlobeIconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 11h16v2H4v-2zm7 8.81A8.002 8.002 0 014.2 4.2C5.94 3.01 8.36 2.2 11 2.04v19.77zM13 2.04c2.64.16 5.06.97 6.8 2.16a8.002 8.002 0 01-5.8 16.7V2.04z" />
  </svg>
);

export default GlobeIcon;
