export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          <span className="text-orange-500">Mobile</span>
          <span className="text-white ml-2">Matrix</span>
        </h1>
        
        <p className="text-lg text-center mb-8 text-gray-300">
          This is a test page to check if the layout is working correctly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Test Card 1</h3>
            <p className="text-gray-400">This should display normally without any layout issues.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Test Card 2</h3>
            <p className="text-gray-400">Text should be horizontal and properly spaced.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-2">Test Card 3</h3>
            <p className="text-gray-400">No text should be overlapping or vertical.</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}