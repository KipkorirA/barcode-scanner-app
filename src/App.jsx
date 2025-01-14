import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner';

function App() {
  return (
    <div className="App min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-6">
        <BarcodeScanner />
      </div>
    </div>
  );
}

export default App;
