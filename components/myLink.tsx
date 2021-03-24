import Link from 'next/link';
import { ReactNode } from 'react';
import NewWebsite from 'public/icons/new_website.svg';

const MyLink = ({
  children,
  className,
  href,
  type = 'route',
  button = false,
  customColor = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  type?: 'route' | 'link';
  button?: boolean;
  customColor?: boolean;
}) => {
  return type === 'route' ? (
    <Link href={href}>
      <a className={`hover:underline ${!customColor && 'text-red-base'} ${className}`}>
        {children}
      </a>
    </Link>
  ) : (
    <span className="inline-flex items-center">
      <a className={`hover:underline text-red-base ${className}`} href={href} target="_blank">
        {children}
      </a>
      <NewWebsite className="fill-current w-4 h-4 ml-1" />
    </span>
  );
};

export default MyLink;
