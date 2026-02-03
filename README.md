# KabuPredict

ブラウザ上で動作する日本株価予測アプリケーションです。LSTM（Long Short-Term Memory）ニューラルネットワークを使用して、過去の株価データから将来の株価を予測します。

## デモ

https://miurakeita0509.github.io/KabuPredict/

## 特徴

- **ブラウザ完結** - サーバー不要。TensorFlow.js によりブラウザ内で学習・予測を実行
- **日本株対応** - 東証上場銘柄の証券コードを入力するだけでデータ取得
- **リアルタイム学習状況表示** - エポックごとの損失値をプログレスバーで表示
- **チャート表示** - 実績値と予測値を折れ線グラフで比較
- **監視銘柄リスト** - 最大20銘柄をローカルストレージに保存、ワンクリックで切り替え
- **ハイパーパラメータ調整** - ウィンドウサイズ、エポック数、学習率、バッチサイズ、予測日数をUI上で変更可能
- **レスポンシブ対応** - デスクトップ・モバイルの両方で利用可能

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | React 19 |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS 3 |
| 機械学習 | TensorFlow.js |
| チャート | Recharts |
| データ取得 | Yahoo Finance API（allorigins.win 経由） |
| デプロイ | GitHub Pages + GitHub Actions |

## モデル構成

- **アーキテクチャ**: 2層 LSTM（各50ユニット）+ Dropout（0.2）+ Dense（1）
- **正規化**: Min-Max 正規化
- **オプティマイザ**: Adam
- **損失関数**: Mean Squared Error
- **予測方式**: 再帰的マルチステップ予測（最大20営業日）

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview
```

## 使い方

1. 証券コードを入力（例: `7203`）して「データ取得」をクリック
2. 必要に応じてハイパーパラメータを調整
3. 「学習開始」をクリックして予測を実行
4. チャートと予測テーブルで結果を確認
5. 「監視銘柄に追加」で銘柄を保存し、次回以降ワンクリックで呼び出し可能

## プロジェクト構成

```
src/
├── App.jsx                    # メインアプリケーション
├── main.jsx                   # エントリーポイント
├── index.css                  # グローバルスタイル
├── components/
│   ├── Header.jsx             # ヘッダー
│   ├── Footer.jsx             # フッター
│   ├── SettingsPanel.jsx      # 証券コード入力・データ取得
│   ├── ControlPanel.jsx       # ハイパーパラメータ設定
│   ├── StockChart.jsx         # 株価チャート
│   ├── TrainingStatus.jsx     # 学習進捗表示
│   ├── PredictionTable.jsx    # 予測結果テーブル
│   └── Watchlist.jsx          # 監視銘柄リスト
├── services/
│   ├── stockApi.js            # Yahoo Finance APIクライアント
│   └── lstmModel.js           # LSTMモデルの構築・学習・予測
└── utils/
    └── dataProcessing.js      # データ正規化・ウィンドウ生成
```

## 注意事項

- 本アプリケーションの予測結果は投資助言ではありません。投資判断は自己責任で行ってください。
- 予測日数が長くなるほど誤差が蓄積され、精度が低下します。
- Yahoo Finance API の仕様変更により、データ取得が一時的に利用できなくなる場合があります。

## ライセンス

MIT
