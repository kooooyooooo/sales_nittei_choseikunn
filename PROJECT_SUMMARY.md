# プロジェクト概要

## アプリケーション名
**Googleカレンダー アポ候補自動抽出アプリ**

## 開発の目的
営業担当者がお客様とのアポイント日程調整を行う際、Googleカレンダーを目視確認して手作業で候補日時を転記する作業を自動化することで、業務効率を大幅に向上させる。

## 主な機能

### 1. Google認証
- OAuth 2.0による安全なログイン
- カレンダー読み取り権限のみ使用
- セッション管理（再ログイン不要）

### 2. 自動抽出ロジック
- **Step 1**: 「アポ可能」キーワードを含む予定を検索
- **Step 2**: 「★」（商談）「⚫︎」（インタビュー）の予定を除外
- **Step 3**: 純粋に空いている時間を算出・出力

### 3. 期間指定
- 今週/来週のクイック選択
- カスタム期間指定（開始日〜終了日）

### 4. 結果表示とコピー
- メール・チャットにそのまま貼り付けられる形式で出力
- ワンクリックでクリップボードにコピー
- 日本語フォーマット対応（祝日表示含む）

### 5. レスポンシブデザイン
- PC・スマートフォン両対応
- モダンで使いやすいUI

## 技術スタック

| 分類 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 認証 | NextAuth.js |
| API | Google Calendar API (googleapis) |
| 日付処理 | date-fns |
| ホスティング | Vercel |

## プロジェクト構造

```
webapp/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts          # NextAuth設定
│   │   └── calendar/extract/
│   │       └── route.ts           # カレンダー抽出API
│   ├── globals.css                # グローバルスタイル
│   ├── layout.tsx                 # ルートレイアウト
│   ├── page.tsx                   # メインページ
│   └── providers.tsx              # SessionProvider
├── types/
│   └── next-auth.d.ts             # NextAuth型定義
├── public/                        # 静的ファイル
├── .env.example                   # 環境変数サンプル
├── .gitignore                     # Git除外設定
├── next.config.js                 # Next.js設定
├── package.json                   # 依存関係
├── postcss.config.mjs             # PostCSS設定
├── tailwind.config.ts             # Tailwind設定
├── tsconfig.json                  # TypeScript設定
├── README.md                      # プロジェクト概要
├── SETUP_GUIDE.md                 # セットアップ手順
├── USAGE_GUIDE.md                 # 使い方ガイド
└── PROJECT_SUMMARY.md             # このファイル
```

## 主要ファイルの説明

### `/app/page.tsx`
- メインのUIコンポーネント
- ログイン画面とメイン画面の切り替え
- 期間選択、抽出実行、結果表示の処理

### `/app/api/auth/[...nextauth]/route.ts`
- NextAuthの設定
- Google OAuth 2.0プロバイダーの設定
- アクセストークンの管理

### `/app/api/calendar/extract/route.ts`
- カレンダーイベントの取得
- アポ可能時間の抽出ロジック
- 時間スロットの計算と除外処理
- 結果のフォーマット

## 抽出ロジックの詳細

### 時間スロット計算アルゴリズム

```typescript
function subtractTimeSlots(available: TimeSlot[], busy: TimeSlot[]): TimeSlot[] {
  // availableスロットからbusyスロットを差し引く
  // 重複パターンを考慮した精密な計算
}
```

**処理パターン**:
1. **完全重複**: busyがavailableを完全に含む → 除外
2. **前半重複**: busyがavailableの開始時刻と重複 → busyの終了時刻以降を残す
3. **後半重複**: busyがavailableの終了時刻と重複 → busyの開始時刻まで残す
4. **中間重複**: busyがavailableの中間にある → 前後に分割

### 結果フォーマット

```typescript
// 入力例
{
  date: Date("2025-11-04"),
  slots: [
    { start: "2025-11-04T11:00:00", end: "2025-11-04T13:00:00" },
    { start: "2025-11-04T14:00:00", end: "2025-11-04T17:00:00" }
  ]
}

// 出力例
"・11/4 (木) 11:00~13:00、14:00~17:00"
```

## セキュリティ対策

1. **OAuth 2.0認証**: Google公式の安全な認証方式を使用
2. **最小権限**: カレンダー読み取り権限のみ要求
3. **トークン管理**: アクセストークンはサーバーサイドでのみ使用
4. **データ非保存**: カレンダー情報は一切保存しない
5. **環境変数**: 機密情報は環境変数で管理（`.env`）

## パフォーマンス

- **抽出処理**: 通常3-5秒以内に完了
- **ページロード**: 初回ロード後は高速表示
- **レスポンシブ**: スムーズなUI操作

## 今後の拡張可能性

### 短期的な改善案
- [ ] 複数カレンダーの統合対応
- [ ] カスタムマーカーの設定機能
- [ ] 時間帯の自動提案（AI活用）
- [ ] 過去の抽出履歴の保存

### 長期的な改善案
- [ ] チームでの共有機能
- [ ] Slack/Teams連携
- [ ] カレンダーへの直接予定登録
- [ ] 自動リマインダー機能
- [ ] 多言語対応

## デプロイ環境

### 開発環境
- **URL**: http://localhost:3000
- **目的**: ローカル開発とテスト

### 本番環境
- **プラットフォーム**: Vercel
- **URL**: (デプロイ後に設定)
- **自動デプロイ**: mainブランチへのpush時

## ライセンス
MIT License

## 開発者向け情報

### 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint
```

### 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| GOOGLE_CLIENT_ID | GoogleのOAuthクライアントID | ✓ |
| GOOGLE_CLIENT_SECRET | GoogleのOAuthクライアントシークレット | ✓ |
| NEXTAUTH_SECRET | NextAuthのシークレットキー | ✓ |
| NEXTAUTH_URL | アプリケーションのURL | ✓ |

### コーディング規約

- **TypeScript**: 厳格な型チェックを使用
- **ESLint**: Next.js推奨設定を使用
- **コンポーネント**: 関数コンポーネントを使用
- **スタイル**: Tailwind CSSのユーティリティクラスを使用

## サポートとフィードバック

- **バグ報告**: GitHub Issues
- **機能要望**: GitHub Issues
- **質問**: README.mdおよびSETUP_GUIDE.mdを参照

## 謝辞

このプロジェクトは、営業現場の実際のニーズから生まれました。
日々の業務効率化に貢献できることを願っています。
