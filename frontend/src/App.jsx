import React, { useState } from 'react';
import { Activity, Server, ArrowRight, Clock, Zap, AlertCircle, CheckCircle2, Database, Layers } from 'lucide-react';

function App() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastRequestMode, setLastRequestMode] = useState(null);

    const addLog = (type, duration, status) => {
        const newLog = {
            id: Date.now(),
            type,
            duration,
            status,
            timestamp: new Date().toLocaleTimeString()
        };
        setLogs(prev => [newLog, ...prev]);
        setLastRequestMode(type);
    };

    const handleCheckout = async () => {
        setLoading(true);
        const startTime = performance.now();

        try {
            const response = await fetch('http://localhost:8000/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: `ord-${Date.now()}`, amount: 100 })
            });

            if (!response.ok) throw new Error('Request failed');

            const data = await response.json();
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(0);

            addLog(duration < 500 ? 'ASYNC' : 'SYNC', duration, 'SUCCESS');

        } catch (error) {
            const endTime = performance.now();
            addLog('ERROR', (endTime - startTime).toFixed(0), 'FAILED');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Sync vs Async Architecture</h1>
                    <p className="text-gray-500 text-lg">Visualizing the impact of coupling and latency</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Architecture Diagram */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                        <div className="absolute top-4 left-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Live Architecture</div>

                        <div className="flex items-center justify-between w-full max-w-lg z-10">
                            {/* Checkout Service */}
                            <div className="flex flex-col items-center relative group">
                                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${loading ? 'bg-blue-50 border-2 border-blue-500 scale-105' : 'bg-white border border-gray-200'}`}>
                                    <Server className={`w-10 h-10 ${loading ? 'text-blue-600' : 'text-gray-400'}`} />
                                </div>
                                <span className="mt-4 font-bold text-gray-700">Checkout Service</span>
                                <span className="text-xs text-gray-400">Producer</span>
                            </div>

                            {/* Connection / Queue */}
                            <div className="flex-1 flex flex-col items-center px-4">
                                {lastRequestMode === 'ASYNC' || (!lastRequestMode && logs.length === 0) ? (
                                    // Async Visualization
                                    <div className="flex flex-col items-center w-full">
                                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden relative mb-2">
                                            {loading && <div className="absolute inset-0 bg-blue-500 animate-progress-fast"></div>}
                                        </div>
                                        <div className="w-16 h-16 bg-purple-50 rounded-xl border-2 border-purple-100 flex items-center justify-center mb-2">
                                            <Layers className="w-8 h-8 text-purple-500" />
                                        </div>
                                        <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">RabbitMQ</span>
                                    </div>
                                ) : (
                                    // Sync Visualization
                                    <div className="flex flex-col items-center w-full">
                                        <div className={`w-full h-1 rounded-full overflow-hidden relative ${loading ? 'bg-gray-200' : 'bg-gray-100'}`}>
                                            {loading && <div className="absolute inset-0 bg-orange-500 animate-progress"></div>}
                                        </div>
                                        <span className="mt-2 text-xs font-bold text-orange-500 uppercase tracking-wider">HTTP Blocking</span>
                                    </div>
                                )}
                            </div>

                            {/* Payment Service */}
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                                    <Activity className="w-10 h-10 text-gray-400" />
                                </div>
                                <span className="mt-4 font-bold text-gray-700">Payment Service</span>
                                <span className="text-xs text-gray-400">Consumer (Slow)</span>
                            </div>
                        </div>

                        {/* Explanation Box */}
                        {lastRequestMode && !loading && (
                            <div className={`mt-12 p-4 rounded-xl border w-full max-w-lg animate-fade-in ${lastRequestMode === 'ASYNC' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
                                <div className="flex items-start">
                                    <div className="mr-3 mt-1">
                                        {lastRequestMode === 'ASYNC' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">
                                            {lastRequestMode === 'ASYNC' ? 'Instant Response!' : 'Blocked Response'}
                                        </h4>
                                        <p className="text-sm leading-relaxed opacity-90">
                                            {lastRequestMode === 'ASYNC'
                                                ? "The Checkout Service didn't wait for Payment. It dropped the message in RabbitMQ and replied to you immediately. Payment is processing it in the background."
                                                : "The Checkout Service was forced to wait 3 seconds for Payment to finish before it could reply to you. This is 'Tight Coupling'."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                            Trigger Request
                        </h2>

                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Click the button below to simulate a user checkout.
                        </p>

                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center mb-6
                ${loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed scale-95'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] hover:shadow-blue-200'
                                }`}
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>

                        <div className="mt-auto">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {logs.slice(0, 3).map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${log.type === 'ASYNC' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                            <span className="font-medium text-sm text-gray-700">Order #{log.id.toString().slice(-4)}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${log.type === 'ASYNC' ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {log.duration}ms
                                        </span>
                                    </div>
                                ))}
                                {logs.length === 0 && <div className="text-center text-gray-400 text-sm py-4">No requests yet</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
