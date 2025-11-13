
import React from 'react';

interface SearchIconProps extends React.SVGProps<SVGSVGElement> {}

const SearchIcon: React.FC<SearchIconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10.5 3a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM2 10.5a8.5 8.5 0 1117 0 8.5 8.5 0 01-17 0z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M14.22 15.78a.75.75 0 001.06 1.06l4.25-4.25a.75.75 0 000-1.06l-4.25-4.25a.75.75 0 00-1.06 1.06L16.94 10l-2.72 2.72v.06l2.72 2.72-2.72 2.72z"
      clipRule="evenodd"
    />
  </svg>
);

export default SearchIcon;
