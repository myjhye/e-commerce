import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import api from '../utils/axiosConfig';

export default function RecommendationSection() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    const itemsPerPage = 4;
    const totalPages = Math.ceil(recommendations.length / itemsPerPage);
    const currentItems = recommendations.slice(
        currentIndex * itemsPerPage,
        (currentIndex + 1) * itemsPerPage
    );

    useEffect(() => {
        if (userInfo) {
            fetchRecommendations();
        }
    }, [userInfo]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await api.get('/api/recommendations/');
            setRecommendations(response.data.recommendations || []);
        } catch (err) {
            console.error('추천 API 에러:', err);
            if (err.code === 'ECONNABORTED') {
                setError('AI 추천을 생성하는 중입니다. 잠시만 기다려주세요...');
            } else {
                setError(err.response?.data?.error || '추천을 불러오는 중 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const goToPrevious = () => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalPages - 1));
    };

    const goToNext = () => {
        setCurrentIndex(prev => (prev < totalPages - 1 ? prev + 1 : 0));
    };

    if (!userInfo) {
        return null;
    }

    return (
        <div className="mb-12">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                    {userInfo.name}님을 위한 추천 상품
                </h2>
                {!loading && !error && recommendations.length > itemsPerPage && (
                    <div className="hidden md:flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">
                            {currentIndex + 1} / {totalPages}
                        </span>
                        <button onClick={goToPrevious} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                            <ChevronLeftIcon />
                        </button>
                        <button onClick={goToNext} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                            <ChevronRightIcon />
                        </button>
                    </div>
                )}
            </div>

            {/* 로딩 상태 UI */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600 text-lg">AI가 맞춤 추천을 생성하고 있습니다...</p>
                </div>
            )}

            {/* 에러 상태 UI */}
            {error && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md text-center">
                    <h3 className="font-bold text-lg mb-2">추천을 불러올 수 없습니다</h3>
                    <p className="mb-3">{error}</p>
                    <button onClick={fetchRecommendations} className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded hover:bg-yellow-600 transition-colors">
                        다시 시도
                    </button>
                </div>
            )}

            {/* 추천 상품이 없는 경우의 UI */}
            {!loading && !error && recommendations.length === 0 && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md text-center">
                    <h3 className="font-bold text-lg mb-2">아직 추천할 상품이 없어요</h3>
                    <p>더 많은 상품을 둘러보시면 개인 맞춤 추천을 받을 수 있습니다!</p>
                </div>
            )}

            {/* 추천 상품 그리드 */}
            {!loading && !error && recommendations.length > 0 && (
                <div className="relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                        {currentItems.map((rec) => {
                            const formattedPrice = new Intl.NumberFormat('ko-KR').format(rec.product.price);
                            return (
                                <div key={rec.product.id}>
                                    <Link to={`/product/${rec.product.id}`} className="block group">
                                        <div className="aspect-square overflow-hidden bg-gray-100 rounded-lg mb-3 border border-gray-200/80 relative">
                                            <img
                                                src={rec.product.image}
                                                alt={rec.product.name}
                                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                                                AI 추천
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="px-1 space-y-1">
                                        <p className="text-sm font-bold truncate">{rec.product.brand || 'No Brand'}</p>
                                        <p className="text-sm text-gray-700 line-clamp-2 leading-tight h-8">{rec.product.name}</p>
                                        <p className="text-base font-bold text-gray-900 pt-1">{formattedPrice}원</p>
                                        <p className="text-sm text-gray-500">즉시 구매가</p>
                                        <div className="flex items-center text-gray-500 pt-1">
                                            <BookmarkIcon />
                                            <span className="text-xs ml-1 font-medium">{rec.product.num_reviews || 0}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 pt-2 border-t border-gray-100 mt-2">
                                            <span className="font-semibold text-blue-600">AI 추천 이유:</span> {rec.reason}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* 모바일 네비게이션 */}
                    {recommendations.length > itemsPerPage && (
                        <div className="md:hidden flex justify-center items-center mt-6 space-x-4">
                            <button onClick={goToPrevious} className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-black transition-colors">
                                이전
                            </button>
                            <span className="text-sm text-gray-600 font-medium">
                                {currentIndex + 1} / {totalPages}
                            </span>
                            <button onClick={goToNext} className="bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-black transition-colors">
                                다음
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
