import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface HomePageProps {
  onStartGame: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartGame }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audio] = useState(new Audio('/music/dead-space-style-ambient-music-184793.mp3')); // Replace with your audio file path
  const [volume, setVolume] = useState(0.5); // Default volume set to 50%
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.loop = true;
    return () => {
      audio.pause();
    };
  }, [audio]);

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden">
      {/* Starry background effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
              opacity: Math.random(),
              animation: `twinkle ${Math.random() * 5 + 3}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-4xl px-4">
        <h1 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Shadows of Infinity
        </h1>
        <p className="text-xl mb-8">Embark on an epic journey through the vast expanse of space, where darkness and light collide in an eternal struggle.</p>
        
        {/* <div className="space-y-6 mb-8">
          <FeatureSlide 
            title="Explore the Unknown" 
            description="Navigate through mysterious star systems and uncover ancient secrets hidden in the depths of space."
          />
          <FeatureSlide 
            title="Strategic Combat" 
            description="Engage in thrilling space battles with advanced weaponry and tactics. Command your fleet and outsmart your enemies."
          />
          <FeatureSlide 
            title="Shape Your Destiny" 
            description="Make choices that impact the fate of entire civilizations. Will you be a beacon of hope or succumb to the shadows?"
          />
        </div> */}

        <p className="text-lg mb-8">
          The cosmos awaits your command. 
        </p>
        
        <button 
          onClick={onStartGame}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition duration-300 transform hover:scale-105"
        >
          Begin Your Journey
        </button>

        {/* Music controls */}
        <div className="fixed bottom-4 right-4 flex items-center space-x-4 bg-gray-800 bg-opacity-50 p-2 rounded-lg">
          <button onClick={togglePlay} className="text-white hover:text-blue-300 transition-colors">
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={toggleMute} className="text-white hover:text-blue-300 transition-colors">
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

interface FeatureSlideProps {
  title: string;
  description: string;
}

const FeatureSlide: React.FC<FeatureSlideProps> = ({ title, description }) => {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 rounded-lg transform hover:scale-105 transition duration-300">
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default HomePage;