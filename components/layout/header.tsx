import { useContext, useEffect, useState } from 'react';
import MyLink from 'components/myLink';
import LightMode from 'public/icons/light_mode.svg';
import DarkMode from 'public/icons/dark_mode.svg';
import ThemeContext from 'theme/ThemeContext';

const tabs = [
  {
    label: '博客',
    goto: '/posts',
  },
  {
    label: '算法可视化',
    goto: '/algorithm',
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

const Header = ({ disableScrollTop = false }: { disableScrollTop?: boolean }) => {
  const { dark, toggleDark } = useContext(ThemeContext);

  const isScrollTop = useScrollTop();

  return (
    <nav
      className={`h-20 wrapper fixed top-0 transition-all duration-300 z-30 ${
        disableScrollTop || !isScrollTop
          ? 'bg-white text-black dark:bg-gray-700 dark:text-white'
          : 'bg-transparent text-white'
      }`}
    >
      <div className="w-full max-w-5xl flex justify-end items-center">
        <MyLink href="/" className="pr-4 mr-auto" customColor>
          <span className="text-2xl">首页</span>
        </MyLink>
        <ul className="px-4 flex items-center">
          {tabs.map((tab) => (
            <li className="ml-4" key={tab.goto}>
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
