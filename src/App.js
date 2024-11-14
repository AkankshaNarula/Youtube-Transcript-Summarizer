import React, { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import { useSpring, animated } from '@react-spring/web';

function App() {
  const [url, setUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [translatedSummary, setTranslatedSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleSubmit = async () => {
    if (!url) return;

    const videoId = extractVideoId(url);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
    setIsProcessing(true);

    try {
      const response = await fetch('http://localhost:5002/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      if (!response.ok) throw new Error("Failed to fetch summary");

      const data = await response.json();
      setSummary(data.summary);

      // Automatically translate to the selected language if not English
      await handleTranslate(data.summary, language);

    } catch (error) {
      console.error("Error:", error);
      alert("There was an error fetching the summary.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (text, targetLanguage) => {
    if (targetLanguage === 'en') {
      setTranslatedSummary(text); // Show the original text for English
      return;
    }

    try {
      const response = await fetch('http://localhost:5002/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, targetLanguage })
      });
      if (!response.ok) throw new Error("Failed to translate summary");

      const data = await response.json();
      setTranslatedSummary(data.translatedText);

    } catch (error) {
      console.error("Translation Error:", error);
      setTranslatedSummary('Error translating text');
    }
  };

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : null;
  };

  const handleDownloadPDF = () => {
    if (!translatedSummary) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(language === 'en' ? "YouTube Video Summary" : "यूट्यूब वीडियो सारांश", 20, 20);
    doc.setFontSize(12);
    doc.text(translatedSummary, 20, 30, { maxWidth: 170 });
    doc.save("summary.pdf");
  };

  const generateFlashcards = () => {
    const sentences = translatedSummary.split('.').filter(Boolean);
    setFlashcards(sentences);
    setCurrentCardIndex(0);
  };

  const nextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{language === 'en' ? 'YouTube Video Summarizer 🎥' : 'यूट्यूब वीडियो सारांश 🎥'}</h1>
        <div className="input-section">
          <input
            type="text"
            placeholder={language === 'en' ? 'Enter YouTube URL' : 'यूट्यूब यूआरएल दर्ज करें'}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              if (summary) handleTranslate(summary, e.target.value); // Re-translate on language change
            }}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="braille">Braille</option>
          </select>
          <button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? (language === 'en' ? 'Processing...' : 'प्रसंस्करण...') : (language === 'en' ? 'Submit' : 'प्रस्तुत')}
          </button>
        </div>

        <div className="content-section">
          <div className="video-box">
            <h3>{language === 'en' ? 'Video' : 'वीडियो'}</h3>
            {embedUrl && (
              <iframe
                src={embedUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>

          <div className="summary-box">
            <h3>{language === 'en' ? 'Summarization of YouTube Video' : 'यूट्यूब वीडियो का सारांश'}</h3>
            {isProcessing ? (
              <div className="spinner"></div>
            ) : (
              <div>
                <p>{translatedSummary || (language === 'en' ? 'Your summary will appear here after processing.' : 'प्रसंस्करण के बाद आपका सारांश यहाँ दिखाई देगा।')}</p>
                {translatedSummary && (
                  <>
                    <button onClick={handleDownloadPDF}>
                      {language === 'en' ? 'Download Summary as PDF' : 'PDF के रूप में सारांश डाउनलोड करें'}
                    </button>
                    <button onClick={generateFlashcards}>
                      {language === 'en' ? 'Generate Flashcards' : 'फ्लैशकार्ड्स बनाएं'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {flashcards.length > 0 && (
          <div className="flashcard-container">
            <button className="arrow-btn" onClick={prevCard}>❮</button>
            <animated.div className="flashcard">
              {flashcards[currentCardIndex]}
            </animated.div>
            <button className="arrow-btn" onClick={nextCard}>❯</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
