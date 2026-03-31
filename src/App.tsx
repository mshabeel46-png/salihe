import React, { useState, useCallback, useRef } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Camera, 
  Leaf, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCcw, 
  Info, 
  ChevronRight,
  History,
  X,
  ShieldCheck,
  Sprout
} from 'lucide-react';
import { diagnoseCrop, type DiagnosisResult } from './services/gemini';
import { cn } from './lib/utils';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<(DiagnosisResult & { id: string, timestamp: number, image: string })[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
  } as any);

  const handleDiagnose = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const diagnosis = await diagnoseCrop(image, "image/jpeg");
      setResult(diagnosis);
      
      // Add to history
      const historyItem = {
        ...diagnosis,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        image: image
      };
      setScanHistory(prev => [historyItem, ...prev].slice(0, 10));
    } catch (err) {
      setError("Failed to analyze the image. Please try again with a clearer photo.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-brand-earth/80 backdrop-blur-md border-b border-brand-green/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-green p-2 rounded-xl">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-green tracking-tight">AgroGuard AI</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-accent">Precision Agriculture</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-brand-green transition-colors">Dashboard</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-brand-green transition-colors">Resources</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-brand-green transition-colors">Support</a>
          </nav>
          <button className="bg-brand-green text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20">
            Get Pro
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Analysis */}
        <div className="lg:col-span-7 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-serif font-medium">Crop Diagnosis</h2>
              <div className="flex gap-2">
                <button 
                  onClick={startCamera}
                  className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Use Camera"
                >
                  <Camera size={20} />
                </button>
                <button 
                  onClick={reset}
                  className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Reset"
                >
                  <RefreshCcw size={20} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!image && !showCamera ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  {...getRootProps()}
                  className={cn(
                    "relative aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-[32px] transition-all cursor-pointer group",
                    isDragActive ? "border-brand-green bg-brand-green/5" : "border-slate-300 bg-white hover:border-brand-green/50 hover:bg-brand-green/[0.02]"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="bg-brand-earth p-6 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-brand-green w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium text-slate-700">Drop your crop image here</p>
                  <p className="text-sm text-slate-400 mt-1">or click to browse files</p>
                  <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><Sprout size={12}/> Tomato</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><Sprout size={12}/> Wheat</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><Sprout size={12}/> Corn</div>
                  </div>
                </motion.div>
              ) : showCamera ? (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative aspect-video bg-black rounded-[32px] overflow-hidden"
                >
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                    <button 
                      onClick={capturePhoto}
                      className="w-16 h-16 rounded-full bg-white border-4 border-brand-green flex items-center justify-center shadow-xl"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-green" />
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="absolute right-6 bottom-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-video rounded-[32px] overflow-hidden group shadow-2xl"
                >
                  <img src={image} alt="Crop preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={reset}
                      className="bg-white text-slate-900 px-6 py-2 rounded-full font-medium shadow-lg"
                    >
                      Change Photo
                    </button>
                  </div>
                  {!result && !isAnalyzing && (
                    <button
                      onClick={handleDiagnose}
                      className="absolute bottom-6 right-6 bg-brand-green text-white px-8 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      Run Analysis <ChevronRight size={20} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-4"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
                <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-green w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Analyzing Crop Health...</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">Our AI is identifying the crop and scanning for patterns of disease or pests.</p>
              </div>
              <div className="w-full max-w-md bg-slate-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-brand-green h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-brand-accent font-bold text-xs uppercase tracking-widest mb-1">
                      <ShieldCheck size={14} /> Diagnosis Report
                    </div>
                    <h3 className="text-4xl font-serif font-medium text-slate-900">
                      {result.disease === 'Healthy' ? 'Healthy Crop' : result.disease}
                    </h3>
                    <p className="text-slate-500 mt-1">Detected in <span className="font-bold text-slate-700">{result.crop}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Confidence</div>
                      <div className="text-2xl font-mono font-bold text-brand-green">{(result.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      result.disease === 'Healthy' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {result.disease === 'Healthy' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                      <Info size={18} className="text-brand-accent" /> Symptoms
                    </h4>
                    <ul className="space-y-2">
                      {result.symptoms.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                      <CheckCircle2 size={18} className="text-brand-green" /> Treatment
                    </h4>
                    <ul className="space-y-2">
                      {result.treatment.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-600 text-sm leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-brand-earth p-6 rounded-2xl space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Prevention Strategy</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.prevention.map((p, i) => (
                      <span key={i} className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-700 border border-slate-200 shadow-sm">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: History & Stats */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History size={20} className="text-brand-accent" /> Recent Scans
              </h3>
              <span className="text-xs font-bold text-slate-400 uppercase">{scanHistory.length} Total</span>
            </div>

            {scanHistory.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-brand-earth rounded-full flex items-center justify-center mx-auto">
                  <History className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 text-sm">Your scan history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scanHistory.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-brand-earth transition-colors cursor-pointer group"
                    onClick={() => {
                      setImage(item.image);
                      setResult(item);
                    }}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={item.image} alt="Scan" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">{item.disease === 'Healthy' ? 'Healthy' : item.disease}</h4>
                      <p className="text-xs text-slate-500">{item.crop} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      item.disease === 'Healthy' ? "bg-green-50 text-green-500" : "bg-orange-50 text-orange-500"
                    )}>
                      <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-brand-green p-8 rounded-[32px] text-white space-y-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-serif mb-2">Grow Smarter</h3>
              <p className="text-brand-earth/70 text-sm leading-relaxed">
                AgroGuard AI uses advanced neural networks to identify over 200+ crop diseases with 98% accuracy.
              </p>
              <button className="mt-6 bg-white text-brand-green px-6 py-2 rounded-full text-sm font-bold hover:bg-brand-earth transition-colors">
                View Guide
              </button>
            </div>
            <Leaf className="absolute -bottom-8 -right-8 text-white/10 w-48 h-48 rotate-12" />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Leaf className="text-brand-green w-6 h-6" />
              <span className="text-xl font-bold">AgroGuard AI</span>
            </div>
            <p className="text-sm">Empowering farmers worldwide with AI-driven insights for healthier crops and higher yields.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Disease Database</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pest Management</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Weather Integration</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email address" className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-brand-green" />
              <button className="bg-brand-green text-white p-2 rounded-lg">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 AgroGuard AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
