import React from 'react';

interface CopyIconProps extends React.SVGProps<SVGSVGElement> {}

const CopyIcon: React.FC<CopyIconProps> = (props) => (
  <svg 
    {...props}
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    aria-hidden="true"
  >
    <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.16 12.66 9 11.625 9h-2.25C8.34 9 7.5 8.16 7.5 7.125V3.375z" />
    <path d="M15.75 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C21.75 8.16 20.91 9 19.875 9h-2.25c-1.035 0-1.875-.84-1.875-1.875V3.375zM12 11.25a.75.75 0 00-.75.75v9c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75h-9z" />
    <path d="M3 11.25a.75.75 0 00-.75.75v9c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75H3z" />
  </svg>
);

export default CopyIcon;
