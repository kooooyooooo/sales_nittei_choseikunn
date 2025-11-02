# Googleカレンダー アポ候補自動抽出アプリ

Googleカレンダーからアポイント可能な候補日時を自動で抽出し、メールやチャットにそのまま貼り付けられる形式で出力するWebアプリケーションです。

## 機能

- **Google OAuth 2.0認証**: Googleアカウントで安全にログイン
- **自動抽出ロジック**:
  - 「アポ可能」と記載された予定を検索
  - 「★」（商談）や「⚫︎」（インタビュー）の予定を除外
  - 純粋に空いている時間を算出
- **期間指定**: 今週/来週のクイック選択、またはカスタム期間指定
- **結果コピー**: ワンクリックでクリップボードにコピー
- **レスポンシブ対応**: PC・スマートフォンどちらでも使用可能

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd webapp
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Google Cloud Consoleでの設定

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuthクライアントID」を選択
5. アプリケーションの種類: 「ウェブアプリケーション」
6. 承認済みのリダイレクトURIを追加:
   - 開発環境: `http://localhost:3000/api/auth/callback/google`
   - 本番環境: `https://yourdomain.com/api/auth/callback/google`
7. クライアントIDとクライアントシークレットをコピー

### 4. Google Calendar APIの有効化

1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」に移動
2. 「Google Calendar API」を検索
3. 「有効にする」をクリック

### 5. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成:

```bash
cp .env.example .env
```

`.env`ファイルを編集して以下を設定:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

`NEXTAUTH_SECRET`はランダムな文字列を生成してください:

```bash
openssl rand -base64 32
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアクセスします。

## Vercelへのデプロイ

### 1. Vercelプロジェクトの作成

```bash
npm install -g vercel
vercel
```

### 2. 環境変数の設定

Vercelのダッシュボードで以下の環境変数を設定:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (本番URLに変更)

### 3. Google Cloud ConsoleでリダイレクトURIを追加

本番環境のURLを承認済みリダイレクトURIに追加:

```
https://yourdomain.vercel.app/api/auth/callback/google
```

## 使い方

1. **ログイン**: 「Googleでログイン」ボタンをクリックしてGoogleアカウントで認証
2. **期間指定**: 「今週」「来週」をクリックするか、カスタム期間を選択
3. **抽出実行**: 「候補を抽出する」ボタンをクリック
4. **結果コピー**: 表示された結果を「結果をコピーする」ボタンでクリップボードにコピー
5. **貼り付け**: メールやチャットに貼り付けて使用

## 出力形式例

```
・11/1 (月祝) 11:00~13:00、14:00~17:00
・11/2 (火) 18:00以降
・11/4 (木) 11:00~15:00、16:00~18:00、19:00以降
・11/5 (金) 終日
```

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **認証**: NextAuth.js
- **API**: Google Calendar API (googleapis)
- **日付処理**: date-fns
- **デプロイ**: Vercel

## セキュリティ

- カレンダー情報は読み取り専用で使用
- OAuth 2.0による安全な認証
- アクセストークンはサーバーサイドでのみ使用
- 個人情報の保存なし

## ライセンス

MIT

## サポート

問題が発生した場合は、Issuesで報告してください。
