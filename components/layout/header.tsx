import { useContext, useEffect, useState } from 'react';
import classnames from 'classnames';
import MyLink from 'components/myLink';
import LightMode from 'public/icons/light_mode.svg';
import DarkMode from 'public/icons/dark_mode.svg';
import ThemeContext from 'theme/ThemeContext';

const tabs = [
  {
    label: '博客',
    goto: '/posts',
  },
];

const useScrollTop = () => {
  const [isScrollTop, setIsScrollTop] = useState(true);

  const handleScroll = () => {
    setIsScrollTop(window.pageYOffset === 0);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isScrollTop;
};

const Header = () => {
  const { dark, toggleDark } = useContext(ThemeContext);

  const isScrollTop = useScrollTop();

  return (
    <nav
      className={classnames('h-20 wrapper fixed top-0 z-10 transition-all duration-300 z-30', {
        ['bg-transparent text-white']: isScrollTop,
        ['bg-white text-black dark:bg-gray-700 dark:text-white']: !isScrollTop,
      })}
    >
      <div className="w-full max-w-5xl flex justify-end items-center">
        <MyLink href="/" className="pr-4 mr-auto" customColor>
          <span className="text-2xl">首页</span>
        </MyLink>
        <ul className="px-4">
          {tabs.map((tab) => (
            <li key={tab.goto}>
              <MyLink href={tab.goto} customColor>
                <span>{tab.label}</span>
              </MyLink>
            </li>
          ))}
        </ul>
        <div className="cursor-pointer" onClick={toggleDark}>
          {!dark ? <DarkMode className="fill-current" /> : <LightMode className="fill-current" />}
        </div>
      </div>
    </nav>
  );
};

export default Header;
