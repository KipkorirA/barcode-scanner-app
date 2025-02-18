import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner';

function App() {
  return (
    <div className="App min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 relative">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url('https://scontent.fnbo9-1.fna.fbcdn.net/v/t39.30808-1/438108926_820712420107507_606728498440331905_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=103&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeFfJgjNQMMyBrntaVRg9I_WBGycZeaQ6e8EbJxl5pDp7yTHNuSXrnFYW2HdZC1ebgj5N1TZYUhgiJbH8k9LKMIe&_nc_ohc=R0NvjttQRt4Q7kNvgFDHdE4&_nc_oc=AdgaG90y7Pw7gcM58dlQJsGe2hJHWGHsjnNmooeJl0BjfYxo9_vtP5GARnuLJwgNKuxP8q9G2ttrAmrxCfCKK_lh&_nc_pt=5&_nc_zt=24&_nc_ht=scontent.fnbo9-1.fna&_nc_gid=AfaxETMwRCDtmozWYrbm3tM&oh=00_AYC-cnvxC69a99nYAgBlpAlSR8p0ypFjqTSs7gL8_nOiAw&oe=67BABC89')`
        }}
      />
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg space-y-4 transition-all duration-300 hover:shadow-xl relative z-10">
        <BarcodeScanner />
      </div>
    </div>
  );
}

export default App;