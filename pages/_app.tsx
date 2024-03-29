import { AppProps } from 'next/app';
import { ThemeProvider } from 'theme/ThemeContext';
import 'styles/globals.css';
import Head from 'next/head';

const MyBlog = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <meta
          name="google-site-verification"
          content="9fkYh9Ohe5LfvsJazovbG9dF4mhToXWKEWhbOF_LJpc"
        />
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link href="/icons/favicon-16x16.png" rel="icon" type="image/png" sizes="16x16" />
        <link href="/icons/favicon-32x32.png" rel="icon" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="theme-color" content="#317EFB" />
      </Head>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
};

export default MyBlog;
