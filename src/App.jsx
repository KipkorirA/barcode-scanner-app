import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner';

function App() {
  return (
    <div className="App min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg space-y-4 transition-all duration-300 hover:shadow-xl">
        <BarcodeScanner />
      </div>
    </div>
  );
}

export default App;