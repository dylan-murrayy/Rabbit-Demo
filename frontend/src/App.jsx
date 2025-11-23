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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

                    {/* SYNC EXPLANATION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-6 text-red-900 flex items-center">
                            <Layers className="w-5 h-5 mr-2" />
                            Under the Hood: Synchronous
                        </h3>

                        {/* Sync Animation Container */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 mb-6 relative overflow-hidden h-32 flex items-center">
                            {/* Nodes */}
                            <div className="absolute left-6 flex flex-col items-center z-10">
                                <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center shadow-sm">
                                    <Server className="w-6 h-6 text-gray-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 mt-1">Checkout</span>
                            </div>

                            <div className="absolute right-6 flex flex-col items-center z-10">
                                <div className="w-12 h-12 bg-white border-2 border-red-200 rounded-lg flex items-center justify-center shadow-sm">
                                    <Activity className="w-6 h-6 text-red-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 mt-1">Payment</span>
                            </div>

                            {/* Path */}
                            <div className="absolute left-12 right-12 h-1 bg-gray-200 top-1/2 -translate-y-1/2 z-0"></div>

                            {/* Moving Packet */}
                            <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 animate-flow-sync">
                                <div className="w-4 h-4 bg-red-500 rounded-full shadow-md"></div>
                            </div>

                            {/* Blocking Label */}
                            <div className="absolute top-2 w-full text-center">
                                <span className="text-[10px] font-mono text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                                    Request BLOCKED waiting for response
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start">
                                <div className="bg-red-100 p-1 rounded mt-1 mr-3"><Clock className="w-3 h-3 text-red-600" /></div>
                                <p className="text-sm text-gray-600"><strong>Cascading Latency:</strong> The user waits for the <em>sum</em> of all service times.</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-red-100 p-1 rounded mt-1 mr-3"><AlertCircle className="w-3 h-3 text-red-600" /></div>
                                <p className="text-sm text-gray-600"><strong>Tight Coupling:</strong> If Payment fails, Checkout fails.</p>
                            </div>
                        </div>
                    </div>

                    {/* ASYNC EXPLANATION */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-lg mb-6 text-blue-900 flex items-center">
                            <Database className="w-5 h-5 mr-2" />
                            Under the Hood: Asynchronous
                        </h3>

                        {/* Async Animation Container */}
                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 mb-6 relative overflow-hidden h-32 flex items-center">

                            {/* Nodes */}
                            <div className="absolute left-6 flex flex-col items-center z-10">
                                <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center shadow-sm">
                                    <Server className="w-6 h-6 text-gray-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 mt-1">Checkout</span>
                            </div>

                            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                                <div className="w-12 h-12 bg-white border-2 border-orange-300 rounded-lg flex items-center justify-center shadow-sm">
                                    <Database className="w-6 h-6 text-orange-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 mt-1">Queue</span>
                            </div>

                            <div className="absolute right-6 flex flex-col items-center z-10">
                                <div className="w-12 h-12 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center shadow-sm">
                                    <Activity className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 mt-1">Worker</span>
                            </div>

                            {/* Paths */}
                            <div className="absolute left-12 right-1/2 h-1 bg-gray-200 top-1/2 -translate-y-1/2 z-0"></div>
                            <div className="absolute left-1/2 right-12 h-1 bg-dashed bg-gray-300 top-1/2 -translate-y-1/2 z-0"></div>

                            {/* Moving Packet 1 (Request) */}
                            <div className="absolute left-12 top-1/2 -translate-y-1/2 z-20 animate-flow-async-request">
                                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-md"></div>
                            </div>

                            {/* Moving Packet 2 (Worker) */}
                            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 z-20 animate-flow-async-worker">
                                <div className="w-4 h-4 bg-orange-500 rounded-full shadow-md opacity-50"></div>
                            </div>

                            {/* Instant Label */}
                            <div className="absolute top-2 left-6">
                                <span className="text-[10px] font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    202 Accepted
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start">
                                <div className="bg-blue-100 p-1 rounded mt-1 mr-3"><Zap className="w-3 h-3 text-blue-600" /></div>
                                <p className="text-sm text-gray-600"><strong>Non-Blocking:</strong> User gets instant response. Work happens later.</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-blue-100 p-1 rounded mt-1 mr-3"><Layers className="w-3 h-3 text-blue-600" /></div>
                                <p className="text-sm text-gray-600"><strong>Decoupled:</strong> Queue absorbs spikes. Worker processes at its own pace.</p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Decision Matrix Section */}
                <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 bg-gray-900 text-white">
                        <h3 className="text-xl font-bold flex items-center">
                            <CheckCircle2 className="w-6 h-6 mr-2 text-green-400" />
                            The Decision Matrix: When to use what?
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        {/* Sync Scenarios */}
                        <div className="p-8">
                            <h4 className="font-bold text-red-900 mb-4 flex items-center">
                                <Layers className="w-5 h-5 mr-2" />
                                Use Synchronous When...
                            </h4>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="bg-red-100 p-1 rounded mr-3 mt-1"><CheckCircle2 className="w-3 h-3 text-red-600" /></div>
                                    <div>
                                        <strong className="block text-gray-900 text-sm">You need an immediate answer</strong>
                                        <p className="text-xs text-gray-500">e.g., User Login (Password correct?), Search Results.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-red-100 p-1 rounded mr-3 mt-1"><CheckCircle2 className="w-3 h-3 text-red-600" /></div>
                                    <div>
                                        <strong className="block text-gray-900 text-sm">Simplicity is priority</strong>
                                        <p className="text-xs text-gray-500">For MVPs and internal tools, async adds complexity you might not need yet.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Async Scenarios */}
                        <div className="p-8 bg-blue-50/30">
                            <h4 className="font-bold text-blue-900 mb-4 flex items-center">
                                <Database className="w-5 h-5 mr-2" />
                                Use Asynchronous When...
                            </h4>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded mr-3 mt-1"><CheckCircle2 className="w-3 h-3 text-blue-600" /></div>
                                    <div>
                                        <strong className="block text-gray-900 text-sm">The task takes &gt; 500ms</strong>
                                        <p className="text-xs text-gray-500">e.g., Sending Emails, Generating PDFs, Video Processing.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded mr-3 mt-1"><CheckCircle2 className="w-3 h-3 text-blue-600" /></div>
                                    <div>
                                        <strong className="block text-gray-900 text-sm">You need Fault Tolerance</strong>
                                        <p className="text-xs text-gray-500">If the Email service is down, the message waits in the queue. No data lost.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded mr-3 mt-1"><CheckCircle2 className="w-3 h-3 text-blue-600" /></div>
                                    <div>
                                        <strong className="block text-gray-900 text-sm">Write-Heavy Traffic</strong>
                                        <p className="text-xs text-gray-500">Ingesting 1M IoT sensor readings? Queue them up and process later.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default App;
