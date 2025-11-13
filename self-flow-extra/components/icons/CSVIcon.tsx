
import React from 'react';

interface CSVIconProps extends React.SVGProps<SVGSVGElement> {}

const CSVIcon: React.FC<CSVIconProps> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M3,3V21H21V3H3M9,5H11V7H9V5M13,5H15V7H13V5M9,9H11V11H9V9M13,9H15V11H13V9M5,19H7V17H5V19M9,13H11V15H9V13M13,13H15V15H13V13M9,17H11V19H9V17M13,17H15V19H13V17M17,19H19V17H17V19M17,13H19V15H17V13M17,9H19V11H17V9M17,5H19V7H17V5M5,13H7V15H5V13M5,9H7V11H5V9M5,5H7V7H5V5Z" />
  </svg>
);

export default CSVIcon;
