import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <p className="text-gray-500">アプリを準備中...</p>
      </main>
      <Footer />
    </div>
  );
}
