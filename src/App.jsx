import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SettingsPanel from './components/SettingsPanel';
import ControlPanel from './components/ControlPanel';
import StockChart from './components/StockChart';
import TrainingStatus from './components/TrainingStatus';
import PredictionTable from './components/PredictionTable';
import { fetchStockCandles } from './services/finnhubApi';

const DEFAULT_PARAMS = {
  windowSize: 30,
  epochs: 50,
  learningRate: 0.001,
  batchSize: 32,
  predictionDays: 5,
};

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [stockCode, setStockCode] = useState('');
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
      const data = await fetchStockCandles(apiKey, stockCode);
      if (data.length < 60) {
        throw new Error(
          'データが不足しています。学習には最低60日分のデータが必要です。'
        );
      }
      setHistoricalData(data);
    } catch (err) {
      setError(err.message);
      setHistoricalData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleStartTraining = async () => {
    // Will be implemented in Commit 5
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
                apiKey={apiKey}
                onApiKeyChange={setApiKey}
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
