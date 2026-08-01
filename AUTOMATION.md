# OfficeWire — ニュース自動更新の仕組み

## 全体像

毎日、GitHub Actionsが自動的に以下を行います。

1. `scripts/feeds.json` に登録したRSSフィードから新着記事を取得
2. 既存の `data/articles.json` にまだ無い記事だけを対象に、Claude APIへ送信
3. Claudeが英語・日本語それぞれの3行要約タイトル・地域・カテゴリーを生成
4. 結果を `data/articles.json` に追記してコミット・プッシュ
5. Netlifyがプッシュを検知して自動的にサイトを再公開

サイト側（`index.html` / `script.js`）は `data/articles.json` を読み込んで表示するだけなので、
手動で編集する必要はもうありません。

## セットアップ（最初の1回だけ）

### 1. Anthropic APIキーを取得する

1. https://console.anthropic.com/ にアクセスしてアカウントを作成（このチャットのアカウントとは別物です）
2. 「API Keys」からキーを発行
3. 支払い方法の登録が必要です（従量課金）。今回程度の記事数なら月間コストはごく小さい想定ですが、
   Consoleの使用量ダッシュボードで確認してください

### 2. GitHubにAPIキーを登録する

1. `officewire` リポジトリ →「Settings」→「Secrets and variables」→「Actions」
2. 「New repository secret」
3. Name: `ANTHROPIC_API_KEY`
4. Secret: 発行したAPIキーを貼り付け
5. 「Add secret」

### 3. RSSフィードを確認・調整する

`scripts/feeds.json` に入っているフィードはサンプルです。実際にURLが有効か、
関連性の高い記事が取れるかを確認し、必要に応じて追加・削除してください。
オフィス・不動産・働き方系のメディアであれば何でも追加できます。

### 4. 動作確認（手動実行）

自動実行を待たなくても、GitHubの「Actions」タブ →「Update news」→「Run workflow」
から手動で1回実行できます。成功すると `data/articles.json` が更新され、
数十秒後にNetlifyのサイトにも反映されます。

## 実行タイミングを変える

`.github/workflows/update-news.yml` の `cron: "0 22 * * *"` の部分を編集してください。
（UTC基準です。日本時間は UTC+9 です）

## 記事が増えすぎないように

`scripts/fetch-news.js` の `MAX_ARTICLES_KEPT`（現在60件）で、
JSONファイルに保持する記事の最大件数を調整できます。
