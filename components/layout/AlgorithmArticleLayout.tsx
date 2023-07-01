import Layout from './index';
import { SEO } from '../../types/interfaces';

interface LayoutProps {
  seo: SEO;
  pageSize?: 'regular' | 'light' | 'thin';
  showBanner?: boolean;
}

const AlgorithmArticleLayout: React.FC<LayoutProps> = ({ seo, pageSize, children }) => {
  return (
    <Layout seo={seo} showBanner={false} pageSize={pageSize} headerDisableScrollTop>
      <article className="wrapper flex-col">
        <div className="w-full max-w-2xl mt-32 prose sm:prose lg:prose-lg dark:prose-dark">
          {children}
        </div>
      </article>
    </Layout>
  );
};

export default AlgorithmArticleLayout;
