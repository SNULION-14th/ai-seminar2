import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const KMA_ENDPOINT = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'

/**
 * 기상청 단기예보 API 프록시.
 * - 공공데이터포털 API는 CORS를 허용하지 않고, 서비스 키를 브라우저에 노출하면 안 되므로 서버에서 대신 호출한다.
 * - `npm run dev`와 `npm run preview`에서 동작한다. 정적 호스팅에 배포할 때는 같은 역할의 서버리스 함수가 필요하다.
 */
function kmaProxy(serviceKey: string | undefined): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/kma')) return next()
    const send = (status: number, body: unknown) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(typeof body === 'string' ? body : JSON.stringify(body))
    }
    if (!serviceKey) return send(503, { error: 'NO_KEY' })

    const q = new URL(req.url, 'http://localhost').searchParams
    const fields = { base_date: /^\d{8}$/, base_time: /^\d{4}$/, nx: /^\d{1,3}$/, ny: /^\d{1,3}$/ }
    const params = new URLSearchParams({ pageNo: '1', numOfRows: '1000', dataType: 'JSON' })
    for (const [name, pattern] of Object.entries(fields)) {
      const value = q.get(name) ?? ''
      if (!pattern.test(value)) return send(400, { error: `invalid ${name}` })
      params.set(name, value)
    }
    // 포털의 '인코딩' 키(이미 %-인코딩됨)와 '디코딩' 키 둘 다 허용
    const key = serviceKey.includes('%') ? serviceKey : encodeURIComponent(serviceKey)

    try {
      const upstream = await fetch(`${KMA_ENDPOINT}?serviceKey=${key}&${params}`)
      const text = await upstream.text()
      try {
        const json = JSON.parse(text)
        // 인증 오류는 { OpenAPI_ServiceResponse: { cmmMsgHeader } } 형태로 온다
        const auth = json.OpenAPI_ServiceResponse?.cmmMsgHeader
        if (auth) return send(502, { error: auth.returnAuthMsg ?? auth.errMsg ?? 'UPSTREAM_ERROR' })
        send(upstream.status, text)
      } catch {
        // 일부 오류는 dataType과 무관하게 XML로 온다
        const reason = text.match(/<returnAuthMsg>([^<]+)</)?.[1] ?? text.match(/<resultMsg>([^<]+)</)?.[1] ?? 'UPSTREAM_ERROR'
        send(502, { error: reason })
      }
    } catch (e) {
      send(502, { error: e instanceof Error ? e.message : 'UPSTREAM_ERROR' })
    }
  }

  return {
    name: 'kma-proxy',
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ 접두사가 없는 변수는 클라이언트 번들에 들어가지 않는다.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), kmaProxy(env.KMA_SERVICE_KEY)],
  }
})
