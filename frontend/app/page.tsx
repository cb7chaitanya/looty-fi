'use client';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCount } from "@/hooks/use-count";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatDate, getRelativeTime, formatTimeOnly } from "@/utils/date";
import { motion, AnimatePresence } from "framer-motion";

interface CounterHistory {
  value: number;
  created_at: string;
  formattedDate?: string;
  relativeTime?: string;
}

// Helper function to group history by date
function groupHistoryByDate(history: CounterHistory[]): [string, CounterHistory[]][] {
  const groups = history.reduce((acc: Record<string, CounterHistory[]>, entry) => {
    const date = new Date(entry.created_at);
    const dateKey = date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return Object.entries(groups);
}

export default function Home() {
  const { loading, counter, history, error, incrementCounter, initializeCounter } = useCount();
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
            <motion.h1 
              className="text-3xl font-bold text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Solana Counter
            </motion.h1>
            
            <div className="flex justify-center mb-8">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 transition-colors" />
            </div>

            {connected ? (
              <div className="text-center">
                <div className="mb-8">
                  <motion.div 
                    key={counter?.value} // Key helps Framer Motion detect changes
                    className="text-6xl font-bold text-purple-400 mb-2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    {loading ? "..." : counter?.value ?? "0"}
                  </motion.div>
                  {counter?.created_at && (
                    <motion.div 
                      className="text-gray-400 text-sm mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      Last updated: {getRelativeTime(counter.created_at)}
                      <div className="text-xs text-gray-500">
                        {formatDate(counter.created_at)}
                      </div>
                    </motion.div>
                  )}
                  <div className="text-gray-400">Current Count</div>
                </div>

                {counter === null && (
                  <motion.button
                    onClick={initializeCounter}
                    disabled={loading}
                    className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors mb-4"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? "Initializing..." : "Initialize Counter"}
                  </motion.button>
                )}

                <motion.button
                  onClick={incrementCounter}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "Processing..." : "Increment Counter"}
                </motion.button>

                {error && (
                  <motion.div 
                    className="mt-4 text-red-400 text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* History Section */}
                {history.length > 0 && (
                  <motion.div 
                    className="mt-8 border-t border-gray-700 pt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">History</h2>
                      <div className="text-xs text-gray-400">
                        {history.length} recent updates
                      </div>
                    </div>
                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-900">
                      <AnimatePresence mode="popLayout">
                        {groupHistoryByDate(history).map(([date, entries]: [string, CounterHistory[]]) => (
                          <motion.div
                            key={date}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-2"
                          >
                            <motion.div 
                              className="text-sm text-gray-400 sticky top-0 bg-gray-800/95 backdrop-blur-sm py-2 z-10 border-b border-gray-700/50"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              {date}
                            </motion.div>
                            <div className="space-y-2">
                              {entries.map((entry, index) => (
                                <motion.div 
                                  key={entry.created_at}
                                  layout
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ 
                                    duration: 0.2, 
                                    delay: index * 0.05,
                                    layout: { duration: 0.3 }
                                  }}
                                  className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm rounded-lg p-3 hover:bg-gray-900 transition-colors group"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="relative">
                                      <motion.span 
                                        className="text-2xl text-purple-400 font-bold tabular-nums"
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                      >
                                        {entry.value}
                                      </motion.span>
                                      {index === 0 && entries[0] === history[0] && (
                                        <motion.div 
                                          className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.3 }}
                                        />
                                      )}
                                    </div>
                                    <div className="text-sm">
                                      <div className="text-gray-300 group-hover:text-white transition-colors">
                                        {formatTimeOnly(entry.created_at)}
                                      </div>
                                      <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                                        {getRelativeTime(entry.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                  {index === 0 && entries[0] === history[0] && (
                                    <motion.div 
                                      className="flex items-center space-x-2"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.2 }}
                                    >
                                      <span className="text-xs bg-purple-600/20 text-purple-400 rounded-full px-2 py-1 border border-purple-500/20">
                                        Latest
                                      </span>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div 
                className="text-center text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Connect your wallet to interact with the counter
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
