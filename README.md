# Anthropic Tokenizer Server

基于 `@anthropic-ai/tokenizer` 的 Claude token 计数 HTTP 服务，兼容 Anthropic 官方 API。

> ⚠️ 对 Claude 3+ 模型仅提供近似估计

## 快速开始

```bash
# Docker
docker run -p 3000:3000 ghcr.io/fengerwoo/anthropic-tokenizer

# 本地
npm install && npm run dev
```

## API

### POST /v1/messages/count_tokens

兼容 [Anthropic 官方 API](https://docs.anthropic.com/en/api/messages-count-tokens)

```bash
curl -X POST http://localhost:3000/v1/messages/count_tokens \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-4-5-20250929","messages":[{"role":"user","content":"Hello"}]}'
```

```json
{"input_tokens": 5}
```

### POST /v1/count_tokens

简单文本计数

```bash
curl -X POST http://localhost:3000/v1/count_tokens \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}'
```

```json
{"token_count": 2}
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务端口 |

## License

MIT
