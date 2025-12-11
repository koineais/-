# 学校将棋クラブ — 将棋サイト

学校の将棋クラブのためのWebサイトです。インタラクティブな将棋盤、詰将棋問題、部の情報を提供しています。

## 機能

- **将棋盤** (`board.html`) — ブラウザ上で将棋をプレイ
  - 合法手のハイライト表示
  - 持駒表示
  - 盤の反転機能

- **詰将棋** (`puzzles.html`) — 1手詰め問題で棋力向上
  - 自動判定機能
  - 複数問題搭載

- **部の情報** (`index.html`, `about.html`)
  - 活動日時・場所
  - 連絡先フォーム

## ローカルで実行

```bash
cd web
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

## GitHub Pages にデプロイ

`.github/workflows/deploy.yml` で自動デプロイが設定されています。`main` ブランチにプッシュすると自動的に `gh-pages` ブランチに公開されます。

```bash
git add .
git commit -m "Add shogi club site"
git push origin main
```

デプロイ後、`https://koineais.github.io/-/` でアクセス可能（リポジトリ名が変更される場合は URL も調整してください）。
