# セットアップガイド

このガイドでは、Googleカレンダー アポ候補自動抽出アプリをローカル環境およびVercelで動作させるための詳細な手順を説明します。

## 前提条件

- Node.js 18.x 以上がインストールされていること
- Googleアカウントを持っていること
- （本番環境）Vercelアカウント（無料プランで可）

## ローカル開発環境のセットアップ

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd webapp
npm install
```

### 2. Google Cloud Consoleでのプロジェクト作成とAPI設定

#### 2-1. プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 画面上部の「プロジェクトの選択」をクリック
3. 「新しいプロジェクト」をクリック
4. プロジェクト名を入力（例: calendar-appointment-app）
5. 「作成」をクリック

#### 2-2. Google Calendar APIの有効化

1. 作成したプロジェクトを選択
2. 左メニューから「APIとサービス」→「ライブラリ」を選択
3. 検索ボックスに「Google Calendar API」と入力
4. 「Google Calendar API」をクリック
5. 「有効にする」をクリック

#### 2-3. OAuth同意画面の設定

1. 左メニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプで「外部」を選択（個人用の場合）
3. 「作成」をクリック
4. アプリ情報を入力：
   - アプリ名: 任意の名前（例: アポ候補抽出アプリ）
   - ユーザーサポートメール: 自分のメールアドレス
   - デベロッパーの連絡先情報: 自分のメールアドレス
5. 「保存して次へ」をクリック
6. スコープの画面では何も追加せず「保存して次へ」
7. テストユーザーの画面で「テストユーザーを追加」をクリック
   - 使用するGoogleアカウントのメールアドレスを入力
8. 「保存して次へ」をクリック
9. 「ダッシュボードに戻る」をクリック

#### 2-4. OAuth 2.0クライアントIDの作成

1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 上部の「＋認証情報を作成」をクリック
3. 「OAuth クライアント ID」を選択
4. アプリケーションの種類で「ウェブアプリケーション」を選択
5. 名前を入力（例: Web Client）
6. 「承認済みのリダイレクトURI」に以下を追加：
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. 「作成」をクリック
8. 表示される「クライアントID」と「クライアントシークレット」をコピーして保存

### 3. 環境変数の設定

1. `.env.example`をコピーして`.env`ファイルを作成：
   ```bash
   cp .env.example .env
   ```

2. `.env`ファイルを編集して、以下の値を設定：

   ```env
   GOOGLE_CLIENT_ID=<コピーしたクライアントID>
   GOOGLE_CLIENT_SECRET=<コピーしたクライアントシークレット>
   NEXTAUTH_SECRET=<ランダムな文字列>
   NEXTAUTH_URL=http://localhost:3000
   ```

3. `NEXTAUTH_SECRET`の生成方法：
   ```bash
   # macOS/Linux
   openssl rand -base64 32
   
   # Windows (PowerShell)
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスします。

### 5. 動作確認

1. 「Googleでログイン」ボタンをクリック
2. Googleアカウントでログイン
3. 権限の許可画面で「許可」をクリック
4. ログイン後、期間を指定して「候補を抽出する」をクリック
5. 結果が表示されることを確認

## Vercelへのデプロイ

### 1. Vercel CLIのインストール（初回のみ）

```bash
npm install -g vercel
```

### 2. Vercelにログイン

```bash
vercel login
```

### 3. プロジェクトのデプロイ

```bash
# プロジェクトルートディレクトリで実行
vercel

# 初回デプロイ時の質問に答える：
# - Set up and deploy "~/webapp"? [Y/n] → Y
# - Which scope do you want to deploy to? → 自分のアカウントを選択
# - Link to existing project? [y/N] → N
# - What's your project's name? → calendar-appointment-extractor（または任意の名前）
# - In which directory is your code located? → ./（エンター）
```

### 4. Vercelダッシュボードでの環境変数設定

1. [Vercelダッシュボード](https://vercel.com/dashboard)にアクセス
2. デプロイしたプロジェクトを選択
3. 「Settings」タブをクリック
4. 左メニューから「Environment Variables」を選択
5. 以下の環境変数を追加：

   | Name | Value |
   |------|-------|
   | GOOGLE_CLIENT_ID | Google Cloud Consoleで取得したクライアントID |
   | GOOGLE_CLIENT_SECRET | Google Cloud Consoleで取得したクライアントシークレット |
   | NEXTAUTH_SECRET | ローカル環境と同じもの、または新規生成 |
   | NEXTAUTH_URL | デプロイされたURL（例: https://your-app.vercel.app） |

6. 各環境変数について：
   - Environment: Production, Preview, Development すべてにチェック
   - 「Add」をクリック

### 5. Google Cloud ConsoleでのリダイレクトURI追加

1. [Google Cloud Console](https://console.cloud.google.com/)に戻る
2. 「APIとサービス」→「認証情報」を選択
3. 作成したOAuthクライアントIDをクリック
4. 「承認済みのリダイレクトURI」に以下を追加：
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
   ※ `your-app.vercel.app` の部分は実際のVercelのURLに置き換えてください

5. 「保存」をクリック

### 6. 再デプロイ

環境変数を設定後、再デプロイを実行：

```bash
vercel --prod
```

または、Vercelダッシュボードの「Deployments」タブから最新のデプロイを選択し、「Redeploy」をクリックします。

### 7. 本番環境の動作確認

1. デプロイされたURLにアクセス
2. ローカル環境と同様に動作確認を実施

## トラブルシューティング

### ログインできない

**症状**: 「Googleでログイン」をクリックしても認証が失敗する

**対処法**:
1. Google Cloud Consoleで正しいリダイレクトURIが設定されているか確認
2. 環境変数が正しく設定されているか確認（特にスペースや改行が入っていないか）
3. OAuth同意画面でテストユーザーに自分のメールアドレスが追加されているか確認

### カレンダーの読み取りができない

**症状**: ログインは成功するが、カレンダーの情報が取得できない

**対処法**:
1. Google Calendar APIが有効化されているか確認
2. ログイン時に「カレンダーの読み取り」権限が要求されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### Vercelでのビルドエラー

**症状**: Vercelへのデプロイ時にビルドが失敗する

**対処法**:
1. ローカル環境で `npm run build` が成功するか確認
2. Vercelの環境変数がすべて設定されているか確認
3. Node.jsのバージョンが合っているか確認（package.jsonに記載）

### 「アポ可能」が検出されない

**症状**: カレンダーに「アポ可能」の予定があるのに抽出されない

**対処法**:
1. 予定のタイトルまたは説明文に「アポ可能」が含まれているか確認
2. 予定が指定した期間内にあるか確認
3. 全角/半角が混在していないか確認

## セキュリティに関する注意事項

- `.env`ファイルは絶対にGitにコミットしないでください（`.gitignore`に含まれています）
- `NEXTAUTH_SECRET`は本番環境では必ず強力なランダム文字列を使用してください
- OAuth 2.0のクライアントシークレットは安全に管理してください
- 本番環境では、Google Cloud Consoleで承認済みドメインとリダイレクトURIを適切に設定してください

## サポート

問題が解決しない場合は、GitHubのIssuesで報告してください。
