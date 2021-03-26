import { memo, ReactNode } from 'react';
import Head from 'next/head';
import { SEO } from 'types/interfaces';
import Header from './header';
import Banner from './banner';
import Footer from './footer';
import styles from './index.module.css';

interface LayoutProps {
  children: ReactNode;
  seo: SEO;
  pageTitle: ReactNode;
  pageSize?: 'regular' | 'light' | 'thin';
}

const sizeMap = {
  regular: 'max-w-5xl',
  light: 'max-w-2xl',
  thin: 'max-w-lg',
};

const Layout = ({ children, seo, pageTitle, pageSize = 'regular' }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
        <meta name="applicable-device" content="pc,mobile" />
        <meta httpEquiv="Cache-Control" content="no-siteapp,no-transform" />
      </Head>
      <Header />
      <Banner title={pageTitle} />
      <main className="wrapper">
        <div className={`w-full ${styles.mainContainer} ${sizeMap[pageSize]}`}>{children}</div>
      </main>
      <Footer />
    </>
  );
};

export default memo(Layout);
