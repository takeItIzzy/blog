import Link from 'next/link';
import { ReactNode } from 'react';
import NewWebsite from 'public/icons/new_website.svg';
import options from 'libs/options';

const MyLink = ({
  children,
  className,
  href,
  type = 'route',
  customColor = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  type?: 'route' | 'link';
  customColor?: boolean;
}) => {
  return options(
    {
      route: () => (
        <Link
          href={href}
          className={`hover:underline ${!customColor && 'text-red-base'} ${className}`}
        >
          {children}
        </Link>
      ),
      link: () => (
        <span className="inline-flex items-center">
          <a className={`hover:underline text-red-base ${className}`} href={href} target="_blank">
            {children}
          </a>
          <NewWebsite className="fill-current w-4 h-4 ml-1" />
        </span>
      ),
    },
    type
  );
};

export default MyLink;
