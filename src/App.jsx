import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SettingsPanel from './components/SettingsPanel';
import ControlPanel from './components/ControlPanel';
import StockChart from './components/StockChart';
import TrainingStatus from './components/TrainingStatus';
import PredictionTable from './components/PredictionTable';
import { fetchStockCandles } from './services/stockApi';
import { trainAndPredict } from './services/lstmModel';

const DEFAULT_PARAMS = {
  windowSize: 30,
  epochs: 50,
  learningRate: 0.001,
  batchSize: 32,
  predictionDays: 5,
};

function getNextBusinessDate(dateStr, daysAhead) {
  // dateStr: "YYYY/MM/DD"
  const parts = dateStr.split('/');
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  let count = 0;
  while (count < daysAhead) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${dd}`;
}

export default function App() {
  const [stockCode, setStockCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [historicalData, setHistoricalData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [error, setError] = useState('');

  const handleFetchData = async () => {
    setError('');
    setIsLoadingData(true);
    setPredictions(null);
    setTrainingStatus(null);
    try {
      const { data, companyName: name } = await fetchStockCandles(stockCode);
      if (data.length < 60) {
        throw new Error(
          'データが不足しています。学習には最低60日分のデータが必要です。'
        );
      }
      setHistoricalData(data);
      setCompanyName(name);
    } catch (err) {
      setError(err.message);
      setHistoricalData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setPredictions(null);
    setError('');
    try {
      const closePrices = historicalData.map((d) => d.close);
      const { predictions: preds, rmse } = await trainAndPredict(
        closePrices,
        params,
        (status) => setTrainingStatus(status)
      );

      // 予測日付を生成（最終データ日から営業日を想定して+1日ずつ）
      const lastDate = historicalData[historicalData.length - 1].date;
      const predWithDates = preds.map((price, i) => ({
        date: getNextBusinessDate(lastDate, i + 1),
        price,
      }));
      setPredictions(predWithDates);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80 lg:flex-shrink-0 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                データ設定
              </h2>
              <SettingsPanel
                stockCode={stockCode}
                onStockCodeChange={setStockCode}
                onFetchData={handleFetchData}
                isLoading={isLoadingData}
                error={error}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                ハイパーパラメータ
              </h2>
              <ControlPanel
                params={params}
                onParamsChange={setParams}
                onStartTraining={handleStartTraining}
                isTraining={isTraining}
                hasData={historicalData != null && historicalData.length > 0}
              />
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 space-y-6">
            <StockChart
              historicalData={historicalData}
              predictions={predictions}
              companyName={companyName}
            />
            <TrainingStatus status={trainingStatus} />
            <PredictionTable predictions={predictions} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
