# 統合テストとデプロイメント検証

このドキュメントでは、闘魂Elixirランディングページの統合テストとデプロイメント検証について説明します。

## 概要

統合テストスイートは以下の要件を検証します：

- **要件 2.1**: GitHub Actions自動デプロイ動作確認
- **要件 2.2**: カスタムドメインでのHTTPS接続確認  
- **要件 5.1**: 3秒以内のファーストビュー表示

## テストスイート構成

### 1. Lighthouse パフォーマンス監査 (`lighthouse-test.js`)

**目的**: サイトのパフォーマンス、アクセシビリティ、SEO、ベストプラクティスを検証

**検証項目**:
- パフォーマンススコア (閾値: 90点以上)
- アクセシビリティスコア (閾値: 95点以上)
- SEOスコア (閾値: 95点以上)
- ベストプラクティススコア (閾値: 90点以上)
- Core Web Vitals (LCP, FID, CLS)
- パフォーマンス改善提案

**実行方法**:
```bash
# ローカルサーバーを起動
npm run serve

# 別のターミナルでテスト実行
npm run test:lighthouse
```

**出力**:
- HTML形式のLighthouseレポート
- JSON形式の詳細データ
- コンソールでの結果サマリー

### 2. クロスブラウザ互換性テスト (`browser-test.js`)

**目的**: 複数ブラウザでの表示確認とレスポンシブデザイン検証

**検証項目**:
- レスポンシブデザイン (320px, 768px, 1024px, 1440px)
- ブラウザ互換性 (Chromium, Firefox, WebKit)
- アニメーション動作
- アクセシビリティ機能
- キーボードナビゲーション
- WebP画像サポート

**実行方法**:
```bash
# ローカルサーバーを起動
npm run serve

# 別のターミナルでテスト実行
npm run test:browser
```

**出力**:
- 各ビューポートのスクリーンショット
- ブラウザ別テスト結果
- JSON形式のサマリーレポート

### 3. GitHub Pages デプロイメント検証 (`deployment-test.js`)

**目的**: GitHub Pagesでの本番デプロイメント状態を検証

**検証項目**:
- GitHub Actions ワークフロー設定確認
- カスタムドメイン設定確認
- HTTPS接続確認
- SSL証明書検証
- SEOメタデータ確認
- 構造化データ検証

**実行方法**:
```bash
npm run test:deployment
```

**出力**:
- デプロイメント状態レポート
- SSL証明書情報
- SEOメタデータ検証結果

### 4. 統合テストランナー (`integration-test.js`)

**目的**: 全テストスイートの統合実行と包括的レポート生成

**実行方法**:
```bash
# 全テスト実行
npm test

# または
node integration-test.js
```

**出力**:
- 包括的なJSON形式レポート
- HTML形式の視覚的レポート
- 要件カバレッジ確認

## 事前準備

### 必要な依存関係

テストスイートは以下の依存関係を自動インストールします：

```bash
npm install --save-dev lighthouse @playwright/test
```

### ローカルサーバー

ローカルテスト実行前にサーバーを起動してください：

```bash
npm run serve
```

サーバーは `http://localhost:8000` で起動します。

## テスト実行手順

### 1. 完全な統合テスト

```bash
# 1. ローカルサーバー起動
npm run serve

# 2. 別のターミナルで統合テスト実行
npm test
```

### 2. 個別テスト実行

```bash
# Lighthouseテストのみ
npm run test:lighthouse

# ブラウザテストのみ  
npm run test:browser

# デプロイメントテストのみ
npm run test:deployment
```

## レポート出力

テスト実行後、以下のディレクトリにレポートが生成されます：

```
./lighthouse-reports/          # Lighthouseレポート
./browser-test-reports/        # ブラウザテストレポート  
./deployment-test-reports/     # デプロイメントテストレポート
./integration-test-reports/    # 統合テストレポート
```

### HTML レポート例

統合テストレポートはHTML形式で視覚的に確認できます：

- テスト結果サマリー
- 要件カバレッジ
- 詳細なエラー情報
- パフォーマンスメトリクス

## CI/CD 統合

GitHub Actions ワークフローでの自動テスト実行例：

```yaml
name: Integration Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build site
      run: npm run build
      
    - name: Start server
      run: npm run serve &
      
    - name: Wait for server
      run: sleep 5
      
    - name: Run integration tests
      run: npm test
      
    - name: Upload test reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-reports
        path: |
          lighthouse-reports/
          browser-test-reports/
          integration-test-reports/
```

## トラブルシューティング

### よくある問題

1. **ローカルサーバーが起動しない**
   ```bash
   # ポート8000が使用中の場合
   lsof -ti:8000 | xargs kill -9
   npm run serve
   ```

2. **Playwrightブラウザのインストール**
   ```bash
   npx playwright install
   ```

3. **Lighthouseのインストール**
   ```bash
   npm install -g lighthouse
   ```

### デプロイメントテストの注意点

- カスタムドメインが設定されていない場合、一部のテストはスキップされます
- DNS伝播には最大24時間かかる場合があります
- GitHub Pagesの設定が正しく行われていることを確認してください

## 要件マッピング

| テストスイート | 要件 | 検証内容 |
|---------------|------|----------|
| Lighthouse | 5.1 | 3秒以内のファーストビュー表示 |
| Browser | 3.1-3.4 | レスポンシブデザイン |
| Deployment | 2.1 | GitHub Actions自動デプロイ |
| Deployment | 2.2 | カスタムドメインHTTPS接続 |
| Lighthouse | 6.1-6.4 | アクセシビリティ対応 |

## 継続的改善

テスト結果を基に以下の改善を継続的に行います：

1. **パフォーマンス最適化**: Lighthouseの提案に基づく改善
2. **アクセシビリティ向上**: WCAG 2.1 AA準拠の維持
3. **ブラウザ互換性**: 新しいブラウザバージョンへの対応
4. **SEO最適化**: 検索エンジン最適化の継続的改善

---

このテストスイートにより、闘魂Elixirランディングページの品質と信頼性を継続的に保証します。