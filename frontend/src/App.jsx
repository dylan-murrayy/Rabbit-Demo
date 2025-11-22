import React, { useState } from 'react';
import { Activity, Server, ArrowRight, Clock, Zap, AlertCircle, CheckCircle2, Database, Layers } from 'lucide-react';

function App() {
    const [logs, setLogs] = useState([]);
    const [syncLoading, setSyncLoading] = useState(false);
    const [asyncLoading, setAsyncLoading] = useState(false);

    const addLog = (type, duration, status) => {
        const newLog = {
            id: Date.now(),
            type,
            duration,
            status,
            timestamp: new Date().toLocaleTimeString()
        };
        setLogs(prev => [newLog, ...prev]);
    };

    const handleSyncCheckout = async () => {
        setSyncLoading(true);
        const startTime = performance.now();
        try {
            const response = await fetch('http://localhost:8000/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: `sync-${Date.now()}`, amount: 100 })
            });
            if (!response.ok) throw new Error('Failed');
            await response.json();
            const endTime = performance.now();
            addLog('SYNC', (endTime - startTime).toFixed(0), 'SUCCESS');
        } catch (e) {
            addLog('SYNC', (performance.now() - startTime).toFixed(0), 'FAILED');
        } finally {
            setSyncLoading(false);
        }
    };

    const handleAsyncCheckout = async () => {
        setAsyncLoading(true);
        const startTime = performance.now();
        try {
            const response = await fetch('http://localhost:8001/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: `async-${Date.now()}`, amount: 100 })
            });
            if (!response.ok) throw new Error('Failed');
            await response.json();
            const endTime = performance.now();
            addLog('ASYNC', (endTime - startTime).toFixed(0), 'SUCCESS');
        } catch (e) {
            addLog('ASYNC', (performance.now() - startTime).toFixed(0), 'FAILED');
        } finally {
            setTimeout(() => setAsyncLoading(false), 500); // Keep animation briefly to show "sent"
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Sync vs Async Architecture</h1>
                    <p className="text-gray-500 text-lg">Side-by-side Comparison</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                    {/* --- SYNC COLUMN --- */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-6 bg-red-50 border-b border-red-100">
                            <h2 className="text-xl font-bold text-red-900 flex items-center">
                                <Layers className="w-6 h-6 mr-2" />
                                Synchronous (Blocking)
                            </h2>
                            <p className="text-red-700 text-sm mt-1">Checkout waits for Payment to finish.</p>
                        </div>

                        <div className="p-8 flex-grow flex flex-col items-center justify-center relative min-h-[300px]">
                            <div className="flex items-center space-x-4 w-full justify-center">
                                {/* Checkout Service */}
                                <div className="flex flex-col items-center z-10">
                                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 border-2 ${syncLoading ? 'bg-red-50 border-red-500 scale-105' : 'bg-white border-gray-200'}`}>
                                        <Server className={`w-10 h-10 ${syncLoading ? 'text-red-500' : 'text-gray-400'}`} />
                                    </div>
                                    <span className="mt-3 font-bold text-gray-700">Checkout</span>
                                </div>

                                {/* Connection Line */}
                                <div className="flex-1 max-w-[120px] h-1 bg-gray-100 relative">
                                    <div className={`absolute inset-0 bg-red-500 transition-all duration-[3000ms] ease-linear ${syncLoading ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>
                                </div>

                                {/* Payment Service */}
                                <div className="flex flex-col items-center z-10">
                                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 border-2 ${syncLoading ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white border-gray-200'}`}>
                                        <Activity className={`w-10 h-10 ${syncLoading ? 'text-red-500' : 'text-gray-400'}`} />
                                    </div>
                                    <span className="mt-3 font-bold text-gray-700">Payment</span>
                                </div>
                            </div>

                            {syncLoading && (
                                <div className="absolute bottom-4 text-red-500 font-mono text-sm animate-pulse">
                                    Waiting for response... (3s)
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={handleSyncCheckout}
                                disabled={syncLoading}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center
                  ${syncLoading
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
                                    }`}
                            >
                                {syncLoading ? 'Blocked...' : 'Trigger Sync Checkout'}
                            </button>
                        </div>
                    </div>

                    {/* --- ASYNC COLUMN --- */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-6 bg-blue-50 border-b border-blue-100">
                            <h2 className="text-xl font-bold text-blue-900 flex items-center">
                                <Zap className="w-6 h-6 mr-2" />
                                Asynchronous (Non-blocking)
                            </h2>
                            <p className="text-blue-700 text-sm mt-1">Checkout sends message and returns instantly.</p>
                        </div>

                        <div className="p-8 flex-grow flex flex-col items-center justify-center relative min-h-[300px]">
                            <div className="flex items-center space-x-4 w-full justify-center">
                                {/* Checkout Service */}
                                <div className="flex flex-col items-center z-10">
                                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 border-2 ${asyncLoading ? 'bg-blue-50 border-blue-500 scale-105' : 'bg-white border-gray-200'}`}>
                                        <Server className={`w-10 h-10 ${asyncLoading ? 'text-blue-500' : 'text-gray-400'}`} />
                                    </div>
                                    <span className="mt-3 font-bold text-gray-700">Checkout</span>
                                </div>

                                {/* Arrow / Message */}
                                <div className="flex-1 max-w-[120px] flex items-center justify-center relative">
                                    {asyncLoading ? (
                                        <div className="absolute w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                                    ) : (
                                        <ArrowRight className="text-gray-200 w-8 h-8" />
                                    )}
                                </div>

                                {/* Queue / RabbitMQ */}
                                <div className="flex flex-col items-center z-10">
                                    <div className="w-24 h-24 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Database className="w-10 h-10 text-orange-500" />
                                    </div>
                                    <span className="mt-3 font-bold text-gray-700">Message Queue</span>
                                </div>
                            </div>

                            {asyncLoading && (
                                <div className="absolute bottom-4 text-blue-500 font-mono text-sm">
                                    Message Sent! (Instant)
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={handleAsyncCheckout}
                                disabled={asyncLoading}
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center
                  ${asyncLoading
                                        ? 'bg-blue-400 text-white cursor-default'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                                    }`}
                            >
                                {asyncLoading ? 'Sent!' : 'Trigger Async Checkout'}
                            </button>
                        </div>
                    </div>

                </div>

                {/* Logs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg flex items-center text-gray-700">
                            <Clock className="w-5 h-5 mr-2 text-gray-400" />
                            Performance Log
                        </h3>
                        <span className="text-xs font-medium px-2 py-1 bg-gray-200 rounded-full text-gray-600">{logs.length} requests</span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                        {logs.length === 0 && (
                            <div className="p-12 text-center text-gray-400 italic">
                                No requests yet. Try both buttons above!
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {log.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">Order #{log.id.toString().slice(-6)}</div>
                                        <div className="text-xs text-gray-400">{log.timestamp}</div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Latency</div>
                                        <div className={`font-mono font-bold text-lg ${log.type === 'SYNC' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {log.duration}ms
                                        </div>
                                    </div>

                                    <div className={`w-24 text-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${log.type === 'SYNC'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {log.type}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanation Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">🔴 Why is Sync Slow?</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            When you click <strong>Checkout</strong>, the server makes a direct HTTP request to the <strong>Payment Service</strong>.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">
                            <li>The Checkout service <strong>waits</strong> for Payment to respond.</li>
                            <li>Payment service sleeps for <strong>3 seconds</strong>.</li>
                            <li>Therefore, Checkout sleeps for 3 seconds.</li>
                            <li><strong>Result:</strong> You (the user) are blocked.</li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">🔵 Why is Async Fast?</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            When you click <strong>Checkout</strong>, the server sends a message to a <strong>Queue</strong> (RabbitMQ) and returns immediately.
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm bg-gray-50 p-4 rounded-xl">
                            <li>Checkout <strong>does not wait</strong> for Payment.</li>
                            <li>The message is stored safely in the Queue.</li>
                            <li>Payment service picks it up <strong>later</strong> (in the background).</li>
                            <li><strong>Result:</strong> You get an instant confirmation.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
