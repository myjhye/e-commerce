import { Pagination } from 'react-bootstrap'

export default function Paginate({ pages, page, onPageChange }) {

    // 페이지가 1개 이하면 표시하지 않음
    if (!pages || pages <= 1) {
        return null;
    }

    return (
        <div className="d-flex justify-content-center my-4">
            <Pagination>
                {[...Array(pages).keys()].map((x) => (
                    <Pagination.Item
                        key={x + 1}
                        active={x + 1 === page}
                        onClick={() => onPageChange(x + 1)}   // 클릭하면 부모 컴포넌트 함수 실행
                    >
                        {x + 1}
                    </Pagination.Item>
                ))}
            </Pagination>
        </div>
    )
}
