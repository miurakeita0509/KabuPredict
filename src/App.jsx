import { useState, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Watchlist, {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from './components/Watchlist';
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
  const [watchlist, setWatchlist] = useState(getWatchlist);

  const fetchData = useCallback(async (code) => {
    setError('');
    setIsLoadingData(true);
    setPredictions(null);
    setTrainingStatus(null);
    try {
      const { data, companyName: name } = await fetchStockCandles(code);
      if (data.length < 60) {
        throw new Error(
          'データが不足しています。学習には最低60日分のデータが必要です。'
        );
      }
      setHistoricalData(data);
      setCompanyName(name);
      setStockCode(code);
    } catch (err) {
      setError(err.message);
      setHistoricalData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleFetchData = () => fetchData(stockCode);

  const handleSelectFromWatchlist = (code) => {
    setStockCode(code);
    fetchData(code);
  };

  const handleAddToWatchlist = () => {
    const code = stockCode.includes('.') ? stockCode : `${stockCode}`;
    const updated = addToWatchlist(code, companyName);
    if (updated === null) {
      setError('監視銘柄は最大20件までです。不要な銘柄を削除してください。');
    } else {
      setWatchlist(updated);
    }
  };

  const handleRemoveFromWatchlist = (code) => {
    const updated = removeFromWatchlist(code);
    setWatchlist(updated);
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

  const hasData = historicalData != null && historicalData.length > 0;
  const canAddToWatchlist =
    hasData && stockCode && !isInWatchlist(stockCode);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-80 lg:flex-shrink-0 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                監視銘柄
              </h2>
              <Watchlist
                items={watchlist}
                onSelect={handleSelectFromWatchlist}
                onRemove={handleRemoveFromWatchlist}
              />
            </div>

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
                onAddToWatchlist={handleAddToWatchlist}
                canAddToWatchlist={canAddToWatchlist}
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
                hasData={hasData}
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
