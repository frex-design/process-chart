# FRe:x Design 工程管理表 — セットアップ手順

## STEP 1: Supabase SQLを実行する

1. https://supabase.com にログイン
2. 作成したプロジェクト（frex-koteihyo）を開く
3. 左メニュー「SQL Editor」をクリック
4. 「New query」をクリック
5. `supabase_schema.sql` の内容を全てコピー＆ペースト
6. 「Run」ボタンをクリック
7. 「Success」と表示されればOK

---

## STEP 2: GitHubにリポジトリを作成してコードをアップする

1. https://github.com/frex-design にログイン
2. 「New repository」をクリック
3. 設定：
   - Repository name: `frex-koteihyo`
   - Public を選択
   - 「Create repository」をクリック

4. ターミナル（コマンドプロンプト）で以下を実行：

```bash
cd frex-koteihyo
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/frex-design/process-chart.git
git push -u origin main
```

---

## STEP 3: GitHub PagesをONにする

1. GitHubのリポジトリページを開く
2. 「Settings」タブをクリック
3. 左メニュー「Pages」をクリック
4. Source: 「Deploy from a branch」
5. Branch: `gh-pages` / `/(root)` を選択
6. 「Save」をクリック

---

## STEP 4: 動作確認

1. GitHubの「Actions」タブでデプロイが完了するのを待つ（1〜2分）
2. 以下のURLでアクセスできれば完成！

```
https://frex-design.github.io/process-chart/
```

---

## ファイル構成

```
frex-koteihyo/
├── .github/
│   └── workflows/
│       └── deploy.yml        # 自動デプロイ設定
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Supabase接続
│   │   └── utils.js          # 定数・ユーティリティ
│   ├── components/
│   │   ├── GanttHeader.jsx   # 月・日ヘッダー
│   │   ├── GanttBody.jsx     # 工程表本体
│   │   ├── SummaryRow.jsx    # サマリーカード
│   │   ├── Legend.jsx        # 業務凡例
│   │   └── Modals.jsx        # 全モーダル
│   ├── App.jsx               # メインアプリ
│   ├── App.css               # スタイル
│   └── main.jsx              # エントリーポイント
├── index.html
├── package.json
├── vite.config.js
└── supabase_schema.sql       # DBテーブル定義
```

---

## 更新・修正する場合

コードを変更したら：

```bash
git add .
git commit -m "変更内容のメモ"
git push
```

これだけで自動的にサイトが更新されます。
