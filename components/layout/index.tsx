import { memo, ReactNode } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { SEO } from 'types/interfaces';
import Header from './header';
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
      <section className="h-80 flex-center bg-gradient-to-r from-yellow-400 to-red-500 dark:from-purple-900 dark:to-indigo-900 relative mb-12">
        <h1 className="text-white text-center leading-normal">{pageTitle}</h1>
        <div className="w-full max-w-5xl absolute bottom-0">
          <div className="absolute -bottom-12 left-6 w-24 h-24 border-4 rounded-full border-white overflow-hidden">
            <Image src="/avatar.jpg" layout="fill" />
          </div>
        </div>
      </section>
      <main className="wrapper">
        <div className={`w-full ${styles.mainContainer} ${sizeMap[pageSize]}`}>{children}</div>
      </main>
      <Footer />
    </>
  );
};

export default memo(Layout);
