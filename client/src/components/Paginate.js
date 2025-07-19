import { Pagination } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

export default function Paginate({ pages, page, keyword = '', isAdmin = false }) {

    // keyword에서 실제 검색어만 추출
    let searchKeyword = '';
    if (keyword && typeof keyword === 'string' && keyword.includes('keyword=')) {
        const match = keyword.match(/keyword=([^&]*)/);
        searchKeyword = match ? match[1] : '';
    }

    // 페이지가 1개 이하면 표시하지 않음
    if (!pages || pages <= 1) {
        return null;
    }

    return (
        <div className="d-flex justify-content-center my-4">
            <Pagination>
                {[...Array(pages).keys()].map((x) => (
                    <LinkContainer
                        key={x + 1}
                        to={!isAdmin 
                            ? {
                                pathname: '/',
                                search: searchKeyword 
                                    ? `?keyword=${searchKeyword}&page=${x + 1}`
                                    : `?page=${x + 1}`
                            }
                            : {
                                pathname: '/admin/productlist/',
                                search: `?keyword=${searchKeyword}&page=${x + 1}`
                            }
                        }
                    >
                        <Pagination.Item active={x + 1 === page}>
                            {x + 1}
                        </Pagination.Item>
                    </LinkContainer>
                ))}
            </Pagination>
        </div>
    )
}