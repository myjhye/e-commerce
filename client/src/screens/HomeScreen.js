// HomeScreen.js

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { listProducts } from "../actions/productActions";
import Paginate from "../components/Paginate";
import ProductGrid from "../components/ProductGrid";
import RecommendationSection from "../components/RecommendationSection";

// KREAM 스타일 섹션 제목 컴포넌트
const SectionHeader = ({ title, description }) => (
  <div className="mb-4">
    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    {description && <p className="text-sm text-gray-500">{description}</p>}
  </div>
);

export default function HomeScreen() {
  const dispatch = useDispatch();

  const {
    loading,
    error,
    products = [],
    pages = 1
  } = useSelector((state) => state.productList);

  const userLogin = useSelector(state => state.userLogin);
  const { userInfo } = userLogin;

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(listProducts({ page: currentPage }));
  }, [dispatch, currentPage]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo(0, 0);
  };

  if (loading) return <div>Loading...</div>; // 실제 앱에서는 스켈레톤 UI 등으로 대체 가능
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 개인 맞춤 추천 섹션 (로그인 시에만 표시) */}
        {userInfo && <RecommendationSection />}

        {/* 구분선 (추천 섹션이 있을 때만 표시) */}
        {userInfo && <div className="my-10 border-t border-gray-100" />}

        {/* 상품 그리드 섹션 */}
        <section>
          <SectionHeader title="모든 상품" description="다양한 상품들을 둘러보세요." />
          <ProductGrid products={products} />
        </section>

        {/* 페이지네이션 */}
        <div className="mt-12">
          <Paginate
            page={currentPage}
            pages={pages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}