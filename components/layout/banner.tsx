import { ReactNode } from 'react';
import Image from 'next/image';
import styles from './banner.module.css';

const Banner = ({ title }: { title: ReactNode }) => {
  return (
    <section className={`h-80 flex-center relative mb-12 ${styles.banner}`}>
      <div className="absolute t-0 l-0 w-full h-full">
        <Image src="/bg.jpg" layout="fill" objectFit="cover" objectPosition="center" />
      </div>
      <h1 className="text-white text-center leading-normal z-10 font-light animate-banner-title">
        {title}
      </h1>
      <div className="w-full max-w-5xl absolute bottom-0 z-10">
        <div className="absolute -bottom-12 left-6 w-24 h-24 border-4 rounded-full border-white overflow-hidden">
          <Image src="/avatar.jpg" layout="fill" />
        </div>
      </div>
    </section>
  );
};

export default Banner;
