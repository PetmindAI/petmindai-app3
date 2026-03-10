import React, { useState } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const HealthScannerPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalysis({
        overallHealth: 'Good',
        confidence: 87,
        findings: [
          { type: 'positive', text: 'Clear and bright eyes' },
          { type: 'positive', text: 'Healthy coat condition' },
          { type: 'positive', text: 'Good body condition' },
          { type: 'warning', text: 'Monitor dental hygiene' },
        ],
        recommendations: [
          'Continue current nutrition plan',
          'Schedule regular dental checkups',
          'Maintain current exercise routine',
          'Consider adding omega-3 supplements for coat health',
        ],
      });
      setAnalyzing(false);
    }, 2500);
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50 pb-20">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Pet Health Scanner</h1>
          <p className="text-lg opacity-90">
            AI-powered health analysis for your pet
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {!selectedImage ? (
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mb-4">
                  <Camera size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Upload Your Pet's Photo
                </h2>
                <p className="text-gray-600">
                  Our AI will analyze your pet's appearance for health insights
                </p>
              </div>

              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <div className="text-center">
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Important Note:</p>
                    <p>
                      This is an AI-based preliminary analysis tool and should not
                      replace professional veterinary care. Always consult your
                      veterinarian for accurate diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <div className="mb-6">
                <img
                  src={selectedImage}
                  alt="Pet"
                  className="w-full max-h-96 object-contain rounded-xl bg-gray-100"
                />
              </div>

              {!analysis && !analyzing && (
                <div className="flex gap-4">
                  <button
                    onClick={handleAnalyze}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all"
                  >
                    Analyze Health
                  </button>
                  <button
                    onClick={resetScanner}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Upload New Photo
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mb-4 animate-pulse">
                    <Camera size={32} className="text-white" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">
                    Analyzing your pet's health...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This may take a few moments
                  </p>
                </div>
              )}

              {analysis && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">
                        Overall Health: {analysis.overallHealth}
                      </h3>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Confidence</p>
                        <p className="text-2xl font-bold text-green-600">
                          {analysis.confidence}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-3">
                      Findings
                    </h4>
                    <div className="space-y-2">
                      {analysis.findings.map((finding: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {finding.type === 'positive' ? (
                            <CheckCircle
                              size={20}
                              className="text-green-500 flex-shrink-0 mt-0.5"
                            />
                          ) : (
                            <AlertCircle
                              size={20}
                              className="text-amber-500 flex-shrink-0 mt-0.5"
                            />
                          )}
                          <p className="text-gray-700">{finding.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-3">
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                        >
                          <span className="text-blue-500 font-bold flex-shrink-0">
                            {index + 1}.
                          </span>
                          <p className="text-gray-700">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={resetScanner}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                      Scan Another Pet
                    </button>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Medical Disclaimer:</p>
                        <p>
                          This analysis is for informational purposes only.
                          Always consult a licensed veterinarian for professional
                          medical advice and treatment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="font-bold text-gray-800 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Advanced machine learning analyzes visual indicators
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="font-bold text-gray-800 mb-2">Quick Results</h3>
            <p className="text-sm text-gray-600">
              Get instant preliminary health insights
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="font-bold text-gray-800 mb-2">Easy to Use</h3>
            <p className="text-sm text-gray-600">
              Simply upload a clear photo of your pet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScannerPage;
