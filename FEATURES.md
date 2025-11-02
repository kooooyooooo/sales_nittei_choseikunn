# 機能詳細

## 画面フロー

### 1. ログイン画面
**状態**: 未認証時に表示

**UI要素**:
- アプリケーションタイトル
- アプリケーション説明文
- 「Googleでログイン」ボタン（Googleロゴ付き）
- 注釈：「カレンダーの読み取り権限のみを使用します」

**デザイン特徴**:
- グラデーション背景（青〜インディゴ）
- モダンなカードデザイン
- カレンダーアイコン

---

### 2. メイン画面
**状態**: 認証後に表示

#### ヘッダーセクション
- アプリタイトル「アポ候補自動抽出」
- ログイン中のメールアドレス表示
- 「ログアウト」ボタン

#### 期間指定エリア
**クイック選択**:
- 「今週」ボタン: 月曜〜日曜を自動設定
- 「来週」ボタン: 次週の月曜〜日曜を自動設定

**カスタム選択**:
- 開始日の日付ピッカー
- 終了日の日付ピッカー

**実行ボタン**:
- 「候補を抽出する」ボタン
  - 通常時: インディゴ色、検索アイコン付き
  - 処理中: グレー、スピナーアニメーション

**エラー表示**:
- エラー発生時に赤いボックスでメッセージ表示

#### 結果表示エリア
**表示タイミング**: 抽出成功後に表示

**ヘッダー**:
- 「抽出結果」タイトル
- 「結果をコピーする」ボタン（緑色、コピーアイコン付き）

**結果本文**:
- グレー背景のボックス
- 等幅フォントで整形された結果テキスト
- 改行とインデントが保持された形式

---

## 機能別詳細

### Google OAuth 2.0 認証

**認証フロー**:
1. ユーザーが「Googleでログイン」をクリック
2. Googleの認証画面にリダイレクト
3. ユーザーがアカウント選択
4. 権限の許可画面（カレンダー読み取り）
5. アプリにリダイレクト
6. セッション確立

**使用スコープ**:
```
openid
email
profile
https://www.googleapis.com/auth/calendar.readonly
```

**トークン管理**:
- アクセストークン: サーバーサイドで保持
- リフレッシュトークン: 長期間のセッション維持
- セッションクッキー: HTTPOnly、Secure

---

### カレンダー抽出ロジック

#### Phase 1: データ取得
```typescript
// Google Calendar APIからイベントリストを取得
calendar.events.list({
  calendarId: 'primary',
  timeMin: startDateTime.toISOString(),
  timeMax: endDateTime.toISOString(),
  singleEvents: true,
  orderBy: 'startTime',
})
```

#### Phase 2: フィルタリング
**アポ可能イベント**:
```typescript
const availableEvents = events.filter(event => {
  const summary = event.summary || '';
  const description = event.description || '';
  return summary.includes('アポ可能') || description.includes('アポ可能');
});
```

**NG予定**:
```typescript
const ngEvents = events.filter(event => {
  const summary = event.summary || '';
  return summary.includes('★') || 
         summary.includes('⚫︎') || 
         summary.includes('●');
});
```

#### Phase 3: 時間計算
```typescript
// アポ可能時間からNG時間を差し引く
function subtractTimeSlots(available, busy): TimeSlot[] {
  // 複雑な重複パターンに対応
  // 1. 完全重複
  // 2. 部分重複（前半）
  // 3. 部分重複（後半）
  // 4. 中間重複
}
```

#### Phase 4: フォーマット
```typescript
// 日本語形式で出力
"・11/4 (木) 11:00~13:00、14:00~17:00"
```

**特殊ケース**:
- **終日**: 12時間以上のアポ可能時間 → "終日"と表示
- **〜時以降**: 23時以降まで空いている → "19:00以降"
- **祝日**: 祝日判定して「月祝」のように表示

---

### 結果フォーマット

#### 標準形式
```
・[月]/[日] ([曜日]) [開始時刻]~[終了時刻]、[開始時刻]~[終了時刻]
```

#### 実装例

**入力データ**:
```javascript
{
  date: new Date("2025-11-04"),
  slots: [
    { start: "11:00", end: "13:00" },
    { start: "14:00", end: "17:00" },
    { start: "18:00", end: "23:00" }
  ]
}
```

**出力結果**:
```
・11/4 (木) 11:00~13:00、14:00~17:00、18:00以降
```

---

### クリップボードコピー

**実装**:
```typescript
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(results);
    alert('クリップボードにコピーしました');
  } catch (err) {
    alert('コピーに失敗しました');
  }
};
```

**対応ブラウザ**:
- Chrome/Edge 66+
- Firefox 63+
- Safari 13.1+
- スマートフォンブラウザ

---

## UI/UXの特徴

### レスポンシブデザイン

**ブレークポイント**:
- モバイル: 〜640px
- タブレット: 641px〜1024px
- デスクトップ: 1025px〜

**調整要素**:
- ヘッダー: 縦並び（モバイル）→ 横並び（デスクトップ）
- 期間選択: 縦並び（モバイル）→ 横2列（デスクトップ）
- ボタン: 全幅（モバイル）→ 固定幅（デスクトップ）

### カラーパレット

**プライマリカラー**:
- インディゴ: #4F46E5 (Tailwind indigo-600)
- 明るいインディゴ: #818CF8 (Tailwind indigo-400)

**セカンダリカラー**:
- グリーン: #16A34A (Tailwind green-600) - コピーボタン
- レッド: #DC2626 (Tailwind red-600) - エラー表示

**背景**:
- グラデーション: from-blue-50 to-indigo-100
- カード背景: white
- 結果表示: gray-50

### アニメーション

**ローディング**:
```css
.animate-spin {
  animation: spin 1s linear infinite;
}
```

**ホバーエフェクト**:
- ボタン: 色の変化（transition-colors）
- カード: 影の強調（hover:shadow-xl）

---

## パフォーマンス最適化

### 初回ロード
- **Next.js App Router**: 自動コード分割
- **サーバーコンポーネント**: 不要なJSを削減
- **Tailwind CSS**: 使用されたクラスのみをビルド

### API呼び出し
- **非同期処理**: async/await
- **エラーハンドリング**: try-catch
- **タイムアウト**: 10秒以内にレスポンス

### クライアント状態管理
- **React Hooks**: useState, useEffect
- **NextAuth Session**: useSession フック
- **最小限の再レンダリング**: 必要な状態のみ更新

---

## アクセシビリティ

### キーボード操作
- Tab: フォーカス移動
- Enter: ボタン実行
- Escape: モーダル閉じる（将来実装）

### スクリーンリーダー対応
- セマンティックHTML使用
- aria-label属性
- alt属性（画像用）

### コントラスト比
- WCAG AA準拠
- テキストと背景の十分なコントラスト

---

## エラーハンドリング

### クライアントサイド
- ネットワークエラー
- 入力検証エラー
- 認証エラー

### サーバーサイド
- Google API エラー
- トークン期限切れ
- レート制限

**エラーメッセージ例**:
- "期間を指定してください"
- "抽出に失敗しました"
- "カレンダーへのアクセスが許可されていません"

---

## 今後の改善案

### 短期（v1.1）
- [ ] ダークモード対応
- [ ] 抽出結果のCSVエクスポート
- [ ] より詳細な祝日判定
- [ ] カスタムマーカー設定

### 中期（v1.5）
- [ ] 複数カレンダー対応
- [ ] チーム共有機能
- [ ] Slack/Teams連携
- [ ] 抽出履歴の保存

### 長期（v2.0）
- [ ] AI による時間帯最適化提案
- [ ] 自動スケジューリング
- [ ] 多言語対応
- [ ] モバイルアプリ版

---

## テスト戦略

### ユニットテスト
- 時間計算ロジック
- フォーマット関数
- 祝日判定

### 統合テスト
- Google API連携
- 認証フロー
- エンドツーエンド

### 手動テスト
- UI/UX確認
- レスポンシブデザイン
- 各種ブラウザ

---

## デプロイチェックリスト

- [ ] 環境変数の設定確認
- [ ] Google OAuth設定確認
- [ ] ビルドエラーなし
- [ ] 本番URLの動作確認
- [ ] エラーログの監視設定
- [ ] パフォーマンスモニタリング

---

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel Documentation](https://vercel.com/docs)
