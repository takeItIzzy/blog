import { AppProps } from 'next/app';
import { ThemeProvider } from 'theme/ThemeContext';
import 'styles/globals.css';

const MyBlog = ({ Component, pageProps }: AppProps) => {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

export default MyBlog;
