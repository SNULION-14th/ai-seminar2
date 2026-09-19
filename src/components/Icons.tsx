import React from 'react';

export const FlameIcon: React.FC<{ className?: string; size?: number }> = ({
  className,
  size = 16,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M8.005 2C8.44928 3.77825 9.33785 5.22307 10.6707 6.33447C12.0036 7.44588 12.67 8.66842 12.67 10.0021C12.67 12.5801 10.5814 14.67 8.005 14.67C5.42859 14.67 3.34 12.5801 3.34 10.0021C3.34 9.28068 3.57384 8.57872 4.00642 8.00158C4.00642 8.9223 4.75235 9.66868 5.6725 9.66868C6.59264 9.66868 7.33857 8.9223 7.33857 8.00158C7.33857 6.66789 6.33892 6.00105 6.33892 4.66737C6.33892 3.77825 6.89428 2.88912 8.005 2Z"
      stroke="#EA580C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TargetIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 14, color = '#4338CA' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1.17 7.00501C1.17 3.78243 3.78242 1.17001 7.005 1.17001C10.2276 1.17001 12.84 3.78243 12.84 7.00501C12.84 10.2276 10.2276 12.84 7.005 12.84C3.78242 12.84 1.17 10.2276 1.17 7.00501Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 7C3.5 5.067 5.067 3.5 7 3.5C8.933 3.5 10.5 5.067 10.5 7C10.5 8.933 8.933 10.5 7 10.5C5.067 10.5 3.5 8.933 3.5 7Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.83 6.99499C5.83 6.35157 6.35159 5.82999 6.995 5.82999C7.63841 5.82999 8.16 6.35157 8.16 6.99499C8.16 7.6384 7.63841 8.15999 6.995 8.15999C6.35159 8.15999 5.83 7.6384 5.83 6.99499Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckIcon: React.FC<{
  className?: string;
  size?: number;
  strokeWidth?: number;
}> = ({ className, size = 14, strokeWidth = 3 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.66 3.5L5.24563 9.92L2.33 7.00182"
      stroke="white"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArrowUpIcon: React.FC<{
  className?: string;
  size?: number;
}> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.75 9L9 3.75L14.25 9"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 14.25V3.75"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronDownIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 16, color = '#94A3B8' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4 6L8 10L12 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GripDotsIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 16, color = '#CBD5E1' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="6" cy="4" r="1" fill={color} />
    <circle cx="10" cy="4" r="1" fill={color} />
    <circle cx="6" cy="8" r="1" fill={color} />
    <circle cx="10" cy="8" r="1" fill={color} />
    <circle cx="6" cy="12" r="1" fill={color} />
    <circle cx="10" cy="12" r="1" fill={color} />
  </svg>
);

export const MoonIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 18, color = '#64748B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M15.74 9.3645C15.5441 12.9929 12.5113 15.8152 8.87825 15.75C5.24519 15.6848 2.31557 12.7555 2.25 9.12244C2.18443 5.48937 5.00642 2.45625 8.63477 2.26C8.93854 2.2435 9.09755 2.60503 8.93629 2.86229C7.8256 4.63936 8.0885 6.94787 9.57032 8.42969C11.0521 9.91151 13.3606 10.1744 15.1377 9.06373C15.3957 8.90246 15.7565 9.06073 15.74 9.3645Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GearIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 18, color = '#64748B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.18546 3.0986C7.27417 2.19792 8.05795 1.51 8.99542 1.51C9.93289 1.51 10.7167 2.19792 10.8054 3.0986C10.8576 3.66844 11.1944 4.17793 11.7078 4.46383C12.2212 4.74972 12.8468 4.77611 13.3841 4.53455C14.2359 4.16135 15.2421 4.47279 15.71 5.25448C16.178 6.03617 15.955 7.03297 15.1945 7.55868C14.7094 7.88714 14.4207 8.42313 14.4207 8.995C14.4207 9.56687 14.7094 10.1029 15.1945 10.4313C15.955 10.957 16.178 11.9538 15.71 12.7355C15.2421 13.5172 14.2359 13.8287 13.3841 13.4555C12.8468 13.2139 12.2212 13.2403 11.7078 13.5262C11.1944 13.8121 10.8576 14.3216 10.8054 14.8914C10.7167 15.7921 9.93289 16.48 8.99542 16.48C8.05795 16.48 7.27417 15.7921 7.18546 14.8914C7.13333 14.3214 6.79644 13.8117 6.2828 13.5257C5.76915 13.2398 5.1433 13.2136 4.60591 13.4555C3.75416 13.8287 2.74798 13.5172 2.28003 12.7355C1.81208 11.9538 2.0351 10.957 2.79556 10.4313C3.28063 10.1029 3.56939 9.56687 3.56939 8.995C3.56939 8.42313 3.28063 7.88714 2.79556 7.55868C2.03621 7.03273 1.81378 6.03683 2.2812 5.25569C2.74861 4.47455 3.75358 4.1627 4.60513 4.53455C5.14245 4.77611 5.76805 4.74972 6.28148 4.46383C6.79491 4.17793 7.13169 3.66844 7.18391 3.0986"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.75 9C6.75 7.75736 7.75736 6.75 9 6.75C10.2426 6.75 11.25 7.75736 11.25 9C11.25 10.2426 10.2426 11.25 9 11.25C7.75736 11.25 6.75 10.2426 6.75 9Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SunIcon: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className, size = 18, color = '#64748B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="9" cy="9" r="3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 1.5V3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 15V16.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.5 9H3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 9H16.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.7 3.7L4.76 4.76" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.24 13.24L14.3 14.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.7 14.3L4.76 13.24" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.24 4.76L14.3 3.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

