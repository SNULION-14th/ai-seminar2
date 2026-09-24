import { useParams } from 'react-router'

// 기록 화면(#/journal)과 공유 페이지(#/s/:payload) 진입점 (SHR-*). 2단계부터 share 담당.
export function JournalPage() {
  return (
    <section className="page">
      <h1 className="page-title">기록</h1>
      <p className="page-lead">도장판과 일지가 여기에 모여요.</p>
    </section>
  )
}

export function SharedPage() {
  // payload는 신뢰할 수 없는 입력이다. SHR-05에서 zod로 검증한 뒤 렌더링한다.
  const { payload } = useParams()

  return (
    <section className="page">
      <h1 className="page-title">공유된 기록</h1>
      <p className="page-lead">
        {payload ? '기록을 불러오는 기능을 준비하고 있어요.' : '링크가 비어 있어요.'}
      </p>
    </section>
  )
}
