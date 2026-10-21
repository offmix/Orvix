# Orvix

ブラウザだけで動く AI チャット。AI モデルは自分の端末で読み込み、サーバーには何も送りません。

## 必要

- WebGPU 対応ブラウザ（Chrome / Edge など）
- 初回はモデルのダウンロードがあります

## 開発

```sh
npm i
npm run dev
```

## Render で公開

1. Render の **New → Blueprint** で `https://github.com/offmix/Orvix` を選択。
2. `render.yaml` の設定を確認して作成。
3. 公開後の `https://orvix-….onrender.com` を開く。

無料プランを指定しています。停止中の初回アクセスは起動に時間がかかります。
AI の計算とモデルの保存は訪問者のブラウザ内だけで行います。API キーは不要です。

手動で **Web Service** を作る場合:

- Runtime: Node
- Branch: `main`
- Build command: `bun install --frozen-lockfile && bun run build`
- Start command: `npm start`
- Environment: `RENDER=true`, `NODE_VERSION=22.16.0`, `HOST=0.0.0.0`
- Health check path: `/`

Render が設定する `PORT` を使用します。GitHub の `main` 更新で自動デプロイします。
